/**
 * B-1001 Local Engine — the built-in model runner.
 *
 * Why a child process: the Harness ships a hardened-runtime Node, and macOS
 * refuses to load an addon signed by another team into it. Running llama.cpp in
 * its own Node both satisfies that rule and keeps a model crash away from the
 * Host. The worker speaks OpenAI-compatible HTTP, so the model menu reaches it
 * exactly like Ollama.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { readdir, statfs } from 'node:fs/promises'
import os, { homedir } from 'node:os'
import { basename, delimiter, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { downloadFile, listFiles, localName, modelDetail, modelPathFor, removeFile, searchModels } from './lib/hub.js'

const PROVIDER_ID = 'local-builtin'
const ROUTE_PREFIX = '/local-engine'
const WORKER_PATH = join(dirname(fileURLToPath(import.meta.url)), 'worker.mjs')
const START_TIMEOUT_MS = 180000
const MAX_TOKENS = 4096

/** A fixed port keeps a written model-menu route valid across restarts. */
const DEFAULT_PORT = 18111

/** Remembers the model last chosen, so a restart comes back to it. */
const STATE_FILE = join(homedir(), '.dsh', 'local-engine', 'state.json')

/** Credential name the engine route refers to; the value is never checked. */
const CREDENTIAL_REF = 'LOCAL_BUILTIN_API_KEY'

/** Where the engine keeps the models it downloaded itself. */
const MODEL_DIR = join(homedir(), '.dsh', 'local-engine', 'models')

export function apply(ctx, config) {
  const rawModelPath = typeof config?.modelPath === 'string' ? config.modelPath.trim() : ''
  let modelPath = rawModelPath.startsWith('~/') ? join(homedir(), rawModelPath.slice(2)) : rawModelPath
  const contextSize = Number(config?.contextSize) > 0 ? Number(config.contextSize) : 4096
  const port = Number(config?.port) > 0 ? Number(config.port) : DEFAULT_PORT
  const displayName =
    typeof config?.displayName === 'string' && config.displayName.length > 0 ? config.displayName : 'Local (built-in)'
  let modelName = modelPath.length > 0 ? basename(modelPath) : ''

  function loadSavedModel() {
    try {
      const saved = JSON.parse(readFileSync(STATE_FILE, 'utf8'))
      return typeof saved?.modelPath === 'string' ? saved.modelPath : ''
    } catch {
      return ''
    }
  }

  function saveModel(next) {
    try {
      mkdirSync(dirname(STATE_FILE), { recursive: true })
      writeFileSync(STATE_FILE, JSON.stringify({ modelPath: next }, null, 2))
    } catch {
      /* a read-only home still runs, it just forgets the choice */
    }
  }

  if (modelPath.length === 0) {
    const saved = loadSavedModel()
    if (saved.length > 0 && existsSync(saved)) {
      modelPath = saved
      modelName = basename(saved)
    }
  }

  const state = {
    sync: null,
    status: 'idle',
    port: 0,
    model: modelName,
    modelPath,
    contextSize,
    error: '',
    pid: 0,
    node: '',
    missing: modelPath.length === 0 ? 'no-model' : existsSync(modelPath) ? '' : 'model-not-found',
  }

  let child = null
  let startTimer = null

  /** Pick a Node that may load the native addon; the Harness one is hardened. */
  function resolveNode() {
    const override = process.env.B1001_NODE
    if (typeof override === 'string' && override.length > 0 && existsSync(override)) return override
    const names = process.platform === 'win32' ? ['node.exe', 'node'] : ['node']
    const fallbacks = []
    for (const dir of (process.env.PATH ?? '').split(delimiter)) {
      if (dir.length === 0) continue
      for (const name of names) {
        const candidate = join(dir, name)
        try {
          if (!existsSync(candidate) || (statSync(candidate).mode & 0o111) === 0) continue
          // Prefer a Node other than the one running Harness: the bundled one is
          // code-signed and macOS refuses third-party native addons in it.
          if (candidate === process.execPath) fallbacks.push(candidate)
          else return candidate
        } catch {
          /* unreadable PATH entry */
        }
      }
    }
    // When `npx @deepseek-ai/dsh web` is the only Node on PATH, it is this one.
    if (fallbacks.length > 0) return fallbacks[0]
    return existsSync(process.execPath) ? process.execPath : ''
  }

  /** Point the model menu at the running worker. */
  async function syncProvider() {
    // pi-ai refuses a hand-declared route without a credential, so store a
    // placeholder key once; the engine ignores the value.
    const credentials = ctx.get('credentials')
    if (credentials !== undefined) {
      try {
        await credentials.set(CREDENTIAL_REF, 'b-1001-local-engine')
      } catch {
        /* the store may be read-only; the route still needs apiKeyEnv below */
      }
    }
    const editor = ctx.get('configEditor')
    if (editor === undefined) return { ok: false, reason: 'no-config-editor' }
    const entry = editor
      .entries()
      .find((c) => c?.options?.id === 'llm-pi-ai' || c?.options?.name === '@deepseek-ai/dsh-llm-pi-ai')
    if (entry === undefined) return { ok: false, reason: 'no-pi-ai-route' }
    const hasModel = state.model.length > 0
    try {
      await editor.edit(entry, (current, inherited) => {
        const providers = { ...(inherited?.providers ?? {}), ...(current?.providers ?? {}) }
        // Ollama is no longer part of this product: remove the route an older
        // version wrote, but only when it still points at Ollama.
        if (providers.local?.baseURL === 'http://127.0.0.1:11434/v1') delete providers.local
        if (!hasModel) {
          delete providers[PROVIDER_ID]
        } else {
          providers[PROVIDER_ID] = {
            displayName,
            api: 'openai-completions',
            apiKeyEnv: CREDENTIAL_REF,
            baseURL: `http://127.0.0.1:${port}/v1`,
            models: [
              {
                id: state.model,
                name: state.model,
                contextWindow: contextSize,
                maxTokens: MAX_TOKENS,
                input: ['text'],
              },
            ],
          }
        }
        return { ...current, providers }
      })
      state.sync = { ok: true, running }
      return state.sync
    } catch (error) {
      state.sync = { ok: false, reason: 'write-failed', error: messageOf(error) }
      return state.sync
    }
  }

  /**
   * The first sync can land inside the Loader's own HMR transaction, which
   * refuses nested ones. Ride that out instead of leaving the model menu empty.
   */
  async function scheduleSync(attempt = 0) {
    const result = await syncProvider()
    if (result?.ok === true || attempt >= 30) return result
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return scheduleSync(attempt + 1)
  }

  function stopWorker() {
    if (startTimer !== null) {
      clearTimeout(startTimer)
      startTimer = null
    }
    if (child !== null) {
      try {
        child.kill('SIGTERM')
      } catch {
        /* already gone */
      }
      child = null
    }
    state.status = 'idle'
    state.port = 0
    state.pid = 0
  }

  function start() {
    if (state.status === 'running') return Promise.resolve(view())
    if (state.missing === 'no-model') {
      state.error = 'No model yet. Download one in the model list, then press Use.'
      return Promise.resolve(view())
    }
    if (state.missing === 'model-not-found') {
      state.error = `No file at ${modelPath}`
      return Promise.resolve(view())
    }
    const nodeBinary = resolveNode()
    if (nodeBinary.length === 0) {
      state.status = 'error'
      state.error = 'No Node executable found for the engine. Install Node, or set B1001_NODE to its path.'
      return Promise.resolve(view())
    }
    state.node = nodeBinary
    state.status = 'starting'
    state.error = ''

    return new Promise((resolve) => {
      const spawned = spawn(nodeBinary, [WORKER_PATH], {
        env: {
          ...process.env,
          B1001_MODEL_PATH: modelPath,
          B1001_CONTEXT: String(contextSize),
          B1001_PORT: String(port),
          B1001_NAME: modelName,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      child = spawned
      state.pid = spawned.pid ?? 0

      let settled = false
      let stderrBuffer = ''
      const settle = async () => {
        if (settled) return
        settled = true
        if (startTimer !== null) {
          clearTimeout(startTimer)
          startTimer = null
        }
        await scheduleSync()
        resolve(view())
      }

      startTimer = setTimeout(() => {
        state.status = 'error'
        state.error = `The engine did not become ready within ${Math.round(START_TIMEOUT_MS / 1000)}s.`
        stopWorker()
        void settle()
      }, START_TIMEOUT_MS)

      let stdoutBuffer = ''
      spawned.stdout?.on('data', (chunk) => {
        stdoutBuffer += chunk.toString('utf8')
        let index = stdoutBuffer.indexOf('\n')
        while (index >= 0) {
          const line = stdoutBuffer.slice(0, index).trim()
          stdoutBuffer = stdoutBuffer.slice(index + 1)
          const match = /^READY (\d+)$/.exec(line)
          if (match !== null) {
            state.status = 'running'
            state.port = Number(match[1])
            void settle()
          }
          index = stdoutBuffer.indexOf('\n')
        }
      })
      spawned.stderr?.on('data', (chunk) => {
        stderrBuffer = `${stderrBuffer}${chunk.toString('utf8')}`.slice(-4000)
        if (state.status !== 'running') state.error = lastLine(stderrBuffer)
      })
      spawned.on('error', (error) => {
        state.status = 'error'
        state.error = messageOf(error)
        void settle()
      })
      spawned.on('exit', (code) => {
        child = null
        if (state.status === 'running' || state.status === 'starting') {
          state.status = code === 0 ? 'idle' : 'error'
          if (code !== 0) state.error = state.error || lastLine(stderrBuffer) || `The engine exited with code ${code}.`
        }
        state.port = 0
        state.pid = 0
        void syncProvider()
        void settle()
      })
    })
  }

  function view() {
    return {
      status: state.status,
      port: state.port,
      pid: state.pid,
      model: state.model,
      modelPath: state.modelPath,
      contextSize: state.contextSize,
      displayName,
      providerId: PROVIDER_ID,
      node: state.node,
      error: state.error,
      missing: state.missing,
      sync: state.sync,
      modelDir: MODEL_DIR,
    }
  }

  /** Swap the engine onto a model from its own shelf. */
  async function useModel(file) {
    const next = join(MODEL_DIR, String(file))
    if (!existsSync(next)) throw new Error(`No downloaded model named ${file}`)
    stopWorker()
    modelPath = next
    modelName = basename(next)
    state.model = modelName
    state.modelPath = next
    state.missing = ''
    state.error = ''
    state.sync = null
    saveModel(next)
    return start()
  }

  /** The models this engine downloaded for itself. */
  async function shelf() {
    try {
      const names = await readdir(MODEL_DIR)
      const models = []
      for (const name of names) {
        if (!name.toLowerCase().endsWith('.gguf')) continue
        const path = join(MODEL_DIR, name)
        let size = 0
        try {
          size = statSync(path).size
        } catch {
          size = 0
        }
        models.push({ name, size, active: path === modelPath })
      }
      return models.sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name))
    } catch {
      return []
    }
  }

  const download = { active: null }

  function startDownload(repo, file) {
    if (download.active !== null && download.active.status === 'running') {
      throw new Error(`A download is already running: ${download.active.name}`)
    }
    const target = modelPathFor(MODEL_DIR, repo, file)
    const job = {
      repo,
      file,
      name: localName(repo, file),
      status: 'running',
      received: 0,
      total: 0,
      percent: 0,
      error: '',
      startedAt: Date.now(),
      finishedAt: null,
    }
    download.active = job
    void (async () => {
      try {
        const result = await downloadFile(repo, file, target, (progress) => {
          job.received = progress.received
          job.total = progress.total
          job.percent = progress.percent
        })
        job.status = 'done'
        job.percent = 100
        job.path = result.path
      } catch (error) {
        job.status = 'error'
        job.error = messageOf(error)
      } finally {
        job.finishedAt = Date.now()
      }
    })()
    return job
  }

  /** What this computer has, so the card can say which model fits. */
  async function systemFacts() {
    const cpus = os.cpus()
    let disk = null
    try {
      const stats = await statfs(homedir())
      disk = {
        freeBytes: Number(stats.bavail) * Number(stats.bsize),
        totalBytes: Number(stats.blocks) * Number(stats.bsize),
      }
    } catch {
      disk = null
    }
    return {
      platform: process.platform,
      arch: process.arch,
      cpu: String(cpus[0]?.model ?? '').trim(),
      cores: cpus.length,
      totalMemoryBytes: os.totalmem(),
      freeMemoryBytes: os.freemem(),
      disk,
    }
  }

  async function readJsonBody(request) {
    const chunks = []
    let bytes = 0
    for await (const chunk of request) {
      bytes += chunk.length
      if (bytes > 256 * 1024) throw new Error('Request body is too large')
      chunks.push(chunk)
    }
    if (chunks.length === 0) return {}
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  }

  function sendJson(response, status, value) {
    const body = JSON.stringify(value)
    response.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'content-length': Buffer.byteLength(body),
      'cache-control': 'no-store',
    })
    response.end(body)
  }

  async function handle(request, response) {
    if (request.headers['x-dsh-local-engine'] !== '1') {
      return sendJson(response, 403, { error: 'This endpoint only answers the Local engine surfaces.' })
    }
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    const path = url.pathname.slice(ROUTE_PREFIX.length) || '/'
    const method = request.method ?? 'GET'
    try {
      if (method === 'GET' && path === '/state') {
        // A request arrives outside the Loader's transaction, so this is where a
        // route that failed to write during activation gets repaired.
        if (state.status === 'running' && state.sync?.ok !== true) void syncProvider()
        return sendJson(response, 200, view())
      }
      if (method === 'GET' && path === '/system') return sendJson(response, 200, await systemFacts())
      if (method === 'POST' && path === '/default') {
        const body = await readJsonBody(request)
        const model = String(body?.model ?? state.model ?? '')
        if (model.length === 0) throw new Error('No model is loaded')
        const defaults = ctx.get('agentDefaultModel')
        if (defaults === undefined) throw new Error('This deployment has no default-model service.')
        await defaults.saveSelection({ provider: PROVIDER_ID, model })
        return sendJson(response, 200, { default: { provider: PROVIDER_ID, model } })
      }
      if (method === 'GET' && path === '/models') return sendJson(response, 200, { models: await shelf(), dir: MODEL_DIR })
      if (method === 'GET' && path === '/hub/search') {
        return sendJson(response, 200, { items: await searchModels(url.searchParams.get('q') ?? '') })
      }
      if (method === 'GET' && path === '/hub/detail') {
        return sendJson(response, 200, await modelDetail(url.searchParams.get('repo') ?? '', os.totalmem()))
      }
      if (method === 'GET' && path === '/hub/files') {
        return sendJson(response, 200, await listFiles(url.searchParams.get('repo') ?? ''))
      }
      if (method === 'POST' && path === '/hub/download') {
        const body = await readJsonBody(request)
        const repo = String(body?.repo ?? '')
        const file = String(body?.file ?? '')
        if (repo.length === 0 || file.length === 0) throw new Error('repo and file are required')
        return sendJson(response, 200, { job: startDownload(repo, file) })
      }
      if (method === 'GET' && path === '/hub/download') return sendJson(response, 200, { job: download.active })
      if (method === 'POST' && path === '/use') {
        const body = await readJsonBody(request)
        return sendJson(response, 200, await useModel(String(body?.file ?? '')))
      }
      if (method === 'DELETE' && path === '/models') {
        const body = await readJsonBody(request)
        const name = String(body?.file ?? '')
        if (name.length === 0 || name.includes('/') || name.includes('..')) throw new Error('Not a model file name')
        await removeFile(join(MODEL_DIR, name))
        return sendJson(response, 200, { removed: name, models: await shelf() })
      }
      if (method === 'POST' && path === '/start') return sendJson(response, 200, await start())
      if (method === 'POST' && path === '/sync') {
        return sendJson(response, 200, { sync: await syncProvider(), engine: view() })
      }
      if (method === 'POST' && path === '/stop') {
        stopWorker()
        await syncProvider()
        return sendJson(response, 200, view())
      }
      return sendJson(response, 404, { error: `Unknown path ${method} ${path}` })
    } catch (error) {
      return sendJson(response, 400, { error: messageOf(error) })
    }
  }

  ctx.inject(['webServer'], (childCtx) => {
    const server = childCtx.get('webServer')
    if (server === undefined) return
    childCtx.effect(
      () => server.register({ kind: 'prefix', path: ROUTE_PREFIX, handler: handle }),
      'b-1001: engine endpoints',
    )
  })

  ctx.effect(
    () => () => {
      const wasRunning = state.status === 'running'
      stopWorker()
      if (wasRunning) void syncProvider()
    },
    'b-1001: engine lifetime',
  )

  if (state.missing === '') void start()
}

function lastLine(text) {
  const lines = String(text).trim().split('\n')
  return lines.length > 0 ? lines[lines.length - 1].slice(0, 300) : ''
}

function messageOf(error) {
  if (error instanceof Error && error.message.length > 0) return error.message
  return String(error)
}
