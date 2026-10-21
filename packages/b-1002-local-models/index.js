/**
 * dsh-local-models — Local models card for Settings -> Models.
 *
 * Host half. It owns three things and nothing else:
 *   1. the facts the card shows (Ollama health, installed models, download job),
 *   2. one download at a time through Ollama's own `/api/pull`,
 *   3. the `local` route on `llm-pi-ai`, so an installed model is selectable in
 *      the model menu without editing any file by hand.
 *
 * The browser reaches all of it over `/local-models/*` on the existing Web
 * server, which keeps the whole plugin same-origin and dependency free.
 */
import { statfs } from 'node:fs/promises'
import { homedir } from 'node:os'
import os from 'node:os'

import { createCatalog } from './lib/catalog.js'
import { createOllamaClient } from './lib/ollama.js'

/** Path prefix claimed on the Web server. */
const ROUTE_PREFIX = '/local-models'

/** Ollama's default local API. */
const OLLAMA_BASE_URL = 'http://127.0.0.1:11434'

/** The route `llm-pi-ai` serves local models under. */
const PROVIDER_ID = 'local'

/** Label shown for that route in the model menu. */
const PROVIDER_DISPLAY_NAME = 'Local (Ollama)'

/** The smallest model the card offers as a first install. */
const STARTER_MODEL = 'qwen3:0.6b'

/** Rough download size of the starter model, in GB. */
const STARTER_APPROX_GB = 0.4

/** Output cap declared for every local model. */
const MAX_TOKENS = 4096

/** Context capacity used when Ollama reports none. */
const DEFAULT_CONTEXT_WINDOW = 8192

/** A model name Ollama's registry accepts: `family`, `family:tag`. */
const MODEL_NAME = /^[a-z0-9][a-z0-9._-]{0,63}(?::[a-zA-Z0-9][a-zA-Z0-9._-]{0,63})?$/


/**
 * Register the card's Host half.
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function apply(ctx) {
  const ollama = createOllamaClient(OLLAMA_BASE_URL)
  const catalog = createCatalog({})

  /** Installed chat models, always the newest read. */
  async function installed() {
    try {
      return await ollama.list()
    } catch {
      return []
    }
  }

  /** One answer for the card's header line. */
  async function health() {
    try {
      return { running: true, version: await ollama.version(), baseURL: ollama.base }
    } catch (error) {
      return { running: false, version: '', baseURL: ollama.base, error: messageOf(error) }
    }
  }

  /**
   * Make installed chat models selectable by writing the `local` route into the
   * `llm-pi-ai` config. The row is rewritten from a fresh read, so providers the
   * user configured elsewhere survive untouched.
   */
  async function syncProvider() {
    const editor = ctx.get('configEditor')
    if (editor === undefined) return { ok: false, reason: 'no-config-editor' }
    const entry = editor
      .entries()
      .find((candidate) => candidate?.options?.id === 'llm-pi-ai' || candidate?.options?.name === '@deepseek-ai/dsh-llm-pi-ai')
    if (entry === undefined) return { ok: false, reason: 'no-pi-ai-route' }

    const models = (await installed()).filter((model) => model.chat)
    try {
      await editor.edit(entry, (current, inherited) => {
        const providers = { ...(inherited?.providers ?? {}), ...(current?.providers ?? {}) }
        if (models.length === 0) {
          delete providers[PROVIDER_ID]
        } else {
          providers[PROVIDER_ID] = {
            displayName: PROVIDER_DISPLAY_NAME,
            api: 'openai-completions',
            baseURL: `${OLLAMA_BASE_URL}/v1`,
            models: models.map((model) => ({
              id: model.tag,
              name: model.tag,
              contextWindow: model.contextWindow > 0 ? model.contextWindow : DEFAULT_CONTEXT_WINDOW,
              maxTokens: MAX_TOKENS,
              input: ['text'],
            })),
          }
        }
        return { ...current, providers }
      })
      return { ok: true, modelCount: models.length }
    } catch (error) {
      return { ok: false, reason: 'write-failed', error: messageOf(error) }
    }
  }

  /** Point new sessions at one local model. */
  async function makeDefault(tag) {
    const defaults = ctx.get('agentDefaultModel')
    if (defaults === undefined) return { ok: false, reason: 'no-default-model-service' }
    try {
      await defaults.saveSelection({ provider: PROVIDER_ID, model: tag })
      return { ok: true }
    } catch (error) {
      return { ok: false, reason: 'write-failed', error: messageOf(error) }
    }
  }

  /** The selection new sessions currently start on, for the card's status line. */
  function currentDefault() {
    const defaults = ctx.get('agentDefaultModel')
    if (defaults === undefined) return null
    try {
      const selection = defaults.currentSelection()
      return { provider: String(selection?.provider ?? ''), model: String(selection?.model ?? '') }
    } catch {
      return null
    }
  }

  /** One download at a time, with progress the card polls. */
  const downloads = createDownloads(ollama, async (job) => {
    if (job.status !== 'done') return
    job.sync = await syncProvider()
    if (job.makeDefault) job.defaultResult = await makeDefault(job.tag)
  })

  /**
   * What this computer has. The card uses memory to decide which models fit;
   * CPU and disk are shown so the choice is not a guess.
   */
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

  /** The whole card state in one answer. */
  async function snapshot() {
    const [probe, models, system] = await Promise.all([health(), installed(), systemFacts()])
    const chat = models.filter((model) => model.chat)
    return {
      ollama: probe,
      system,
      installed: models,
      chatModelCount: chat.length,
      job: downloads.view(),
      starter: { tag: STARTER_MODEL, approxGB: STARTER_APPROX_GB },
      provider: { id: PROVIDER_ID, displayName: PROVIDER_DISPLAY_NAME, modelCount: chat.length },
      default: currentDefault(),
      catalogQueries: catalog.size(),
    }
  }

  /**
   * One request from the card.
   *
   * @param {import('node:http').IncomingMessage} request
   * @param {import('node:http').ServerResponse} response
   */
  async function handle(request, response) {
    if (request.headers['x-dsh-local-models'] !== '1' || !sameOrigin(request)) {
      return sendJson(response, 403, { error: 'This endpoint only answers the Local models card.' })
    }
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    const path = url.pathname.slice(ROUTE_PREFIX.length) || '/'
    const method = request.method ?? 'GET'

    try {
      if (method === 'GET' && path === '/state') {
        return sendJson(response, 200, await snapshot())
      }
      if (method === 'GET' && path === '/catalog') {
        const result = await catalog.search(url.searchParams.get('q') ?? '', {
          force: url.searchParams.get('force') === '1',
        })
        return sendJson(response, 200, result)
      }
      if (method === 'GET' && path === '/download') {
        return sendJson(response, 200, { job: downloads.view() })
      }
      if (method === 'POST' && path === '/download') {
        const body = await readJson(request)
        const tag = requireTag(body?.tag)
        const job = downloads.start(tag, { makeDefault: body?.makeDefault === true })
        return sendJson(response, 200, { job })
      }
      if (method === 'POST' && path === '/cancel') {
        return sendJson(response, 200, { cancelled: downloads.cancel() })
      }
      if (method === 'POST' && path === '/remove') {
        const body = await readJson(request)
        const tag = requireTag(body?.tag)
        await ollama.remove(tag)
        const provider = await syncProvider()
        return sendJson(response, 200, { removed: true, provider })
      }
      if (method === 'POST' && path === '/default') {
        const body = await readJson(request)
        const tag = requireTag(body?.tag)
        const provider = await syncProvider()
        if (provider.ok !== true) return sendJson(response, 409, { error: describeSyncFailure(provider), provider })
        const result = await makeDefault(tag)
        if (result.ok !== true) return sendJson(response, 409, { error: describeDefaultFailure(result) })
        return sendJson(response, 200, { default: { provider: PROVIDER_ID, model: tag } })
      }
      if (method === 'POST' && path === '/sync') {
        const provider = await syncProvider()
        const status = provider.ok === true ? 200 : 409
        return sendJson(response, status, provider.ok === true ? provider : { error: describeSyncFailure(provider), provider })
      }
      return sendJson(response, 404, { error: `Unknown path ${method} ${path}` })
    } catch (error) {
      return sendJson(response, 400, { error: messageOf(error) })
    }
  }

  ctx.inject(['webServer'], (child) => {
    const server = child.get('webServer')
    if (server === undefined) return
    child.effect(
      () => server.register({ kind: 'prefix', path: ROUTE_PREFIX, handler: handle }),
      'local-models: card endpoints',
    )
  })
}

/**
 * One download at a time. Ollama serializes pulls itself, so a second request
 * is refused with a status the card can show instead of a silent queue.
 *
 * @param {ReturnType<typeof createOllamaClient>} ollama
 * @param {(job: object) => Promise<void>} onSettled
 */
function createDownloads(ollama, onSettled) {
  let active = null

  function view() {
    if (active === null) return null
    return {
      tag: active.tag,
      status: active.status,
      phase: active.phase,
      percent: active.percent,
      completed: active.completed,
      total: active.total,
      message: active.message,
      makeDefault: active.makeDefault,
      startedAt: active.startedAt,
      finishedAt: active.finishedAt,
      sync: active.sync ?? null,
      defaultResult: active.defaultResult ?? null,
    }
  }

  function start(tag, options) {
    if (active !== null && active.status === 'running') {
      throw new Error(`A download is already running: ${active.tag}`)
    }
    const job = {
      tag,
      status: 'running',
      phase: 'starting',
      percent: 0,
      completed: 0,
      total: 0,
      message: '',
      makeDefault: options?.makeDefault === true,
      startedAt: Date.now(),
      finishedAt: null,
      sync: null,
      defaultResult: null,
      controller: new AbortController(),
    }
    active = job
    void run(job)
    return view()
  }

  async function run(job) {
    try {
      const final = await ollama.pull(job.tag, {
        signal: job.controller.signal,
        onProgress: (progress) => {
          job.phase = progress.status
          job.percent = progress.percent
          job.completed = progress.completed
          job.total = progress.total
        },
      })
      job.phase = final.status
      job.percent = 100
      job.completed = final.completed
      job.total = final.total
      job.status = 'done'
    } catch (error) {
      job.status = job.controller.signal.aborted ? 'cancelled' : 'error'
      job.message = messageOf(error)
    } finally {
      job.finishedAt = Date.now()
      try {
        await onSettled(job)
      } catch (error) {
        if (job.message.length === 0) job.message = messageOf(error)
      }
    }
  }

  function cancel() {
    if (active === null || active.status !== 'running') return false
    active.controller.abort()
    return true
  }

  return { start, cancel, view }
}

/** Accept only names the Ollama registry could publish. */
function requireTag(value) {
  const tag = String(value ?? '').trim()
  if (!MODEL_NAME.test(tag)) throw new Error(`Not a model name: ${JSON.stringify(String(value ?? ''))}`)
  return tag
}

/** A same-origin page needs no CORS, so anything else is refused. */
function sameOrigin(request) {
  const origin = request.headers.origin
  if (typeof origin !== 'string') return true
  try {
    return new URL(origin).host === request.headers.host
  } catch {
    return false
  }
}

/** Answer one request. */
function sendJson(response, status, value) {
  const body = JSON.stringify(value)
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  })
  response.end(body)
}

/** Read a small JSON body; the card only ever sends a model name. */
async function readJson(request) {
  const chunks = []
  let bytes = 0
  for await (const chunk of request) {
    bytes += chunk.length
    if (bytes > 64 * 1024) throw new Error('Request body is too large')
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new Error('Request body is not valid JSON')
  }
}

/** Turn a refused sync into text a person can act on. */
function describeSyncFailure(provider) {
  if (provider.reason === 'no-config-editor') return 'This deployment has no configuration editor, so the model cannot be added to the model menu.'
  if (provider.reason === 'no-pi-ai-route') return 'The llm-pi-ai plugin is not active, so there is no route to add local models to.'
  return provider.error ?? 'Could not update the model menu.'
}

/** Turn a refused default-model write into text a person can act on. */
function describeDefaultFailure(result) {
  if (result.reason === 'no-default-model-service') return 'This deployment has no default-model service to update.'
  return result.error ?? 'Could not save the default model.'
}

/** Read a message out of an unknown thrown value. */
function messageOf(error) {
  if (error instanceof Error && error.message.length > 0) return error.message
  return String(error)
}
