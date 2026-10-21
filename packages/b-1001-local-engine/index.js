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
import { existsSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PROVIDER_ID = 'local-builtin'
const ROUTE_PREFIX = '/local-engine'
const WORKER_PATH = join(dirname(fileURLToPath(import.meta.url)), 'worker.mjs')
const START_TIMEOUT_MS = 180000
const MAX_TOKENS = 4096

/** A fixed port keeps a written model-menu route valid across restarts. */
const DEFAULT_PORT = 18111

export function apply(ctx, config) {
  const rawModelPath = typeof config?.modelPath === 'string' ? config.modelPath.trim() : ''
  const modelPath = rawModelPath.startsWith('~/') ? join(homedir(), rawModelPath.slice(2)) : rawModelPath
  const contextSize = Number(config?.contextSize) > 0 ? Number(config.contextSize) : 4096
  const port = Number(config?.port) > 0 ? Number(config.port) : DEFAULT_PORT
  const displayName =
    typeof config?.displayName === 'string' && config.displayName.length > 0 ? config.displayName : 'Local (built-in)'
  const modelName = modelPath.length > 0 ? basename(modelPath) : ''

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
    const path = process.env.PATH ?? ''
    for (const dir of path.split(':')) {
      if (dir.length === 0) continue
      const candidate = join(dir, 'node')
      if (candidate === process.execPath) continue
      try {
        if (existsSync(candidate) && statSync(candidate).mode & 0o111) return candidate
      } catch {
        /* unreadable PATH entry */
      }
    }
    return ''
  }

  /** Point the model menu at the running worker. */
  async function syncProvider() {
    const editor = ctx.get('configEditor')
    if (editor === undefined) return { ok: false, reason: 'no-config-editor' }
    const entry = editor
      .entries()
      .find((c) => c?.options?.id === 'llm-pi-ai' || c?.options?.name === '@deepseek-ai/dsh-llm-pi-ai')
    if (entry === undefined) return { ok: false, reason: 'no-pi-ai-route' }
    const running = state.status === 'running' && state.port > 0
    try {
      await editor.edit(entry, (current, inherited) => {
        const providers = { ...(inherited?.providers ?? {}), ...(current?.providers ?? {}) }
        if (!running) {
          delete providers[PROVIDER_ID]
        } else {
          providers[PROVIDER_ID] = {
            displayName,
            api: 'openai-completions',
            baseURL: `http://127.0.0.1:${state.port}/v1`,
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
      state.error = 'Set modelPath in the plugin configuration to a .gguf file.'
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
    }
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
      if (method === 'GET' && path === '/state') return sendJson(response, 200, view())
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
