/**
 * Minimal Ollama HTTP client. Zero dependencies: Node's global fetch only.
 *
 * Every function here answers facts or performs one operation. Progress is
 * reported through a callback so the caller decides how it is stored.
 */

/** Ollama reports `completion` for models that can hold a chat. */
const CHAT_CAPABILITY = 'completion'

/** Capability values Ollama may report for a model. */
const KNOWN_CAPABILITIES = ['completion', 'tools', 'thinking', 'vision', 'embedding', 'audio']

/**
 * @param {string} baseURL - root of the Ollama HTTP API, without `/api`.
 */
export function createOllamaClient(baseURL) {
  const base = String(baseURL || 'http://127.0.0.1:11434').replace(/\/+$/, '')

  /** Read the API version, which doubles as the health probe. */
  async function version() {
    const response = await fetch(`${base}/api/version`, { signal: AbortSignal.timeout(3000) })
    if (!response.ok) throw new Error(`Ollama answered HTTP ${response.status}`)
    const body = await response.json()
    return typeof body?.version === 'string' ? body.version : 'unknown'
  }

  /** List the models stored on this machine. */
  async function list() {
    const response = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(8000) })
    if (!response.ok) throw new Error(`Ollama answered HTTP ${response.status}`)
    const body = await response.json()
    const models = Array.isArray(body?.models) ? body.models : []
    return models.map(toModel).filter((model) => model.tag.length > 0)
  }

  /**
   * Download one model. Resolves with the final progress once Ollama reports
   * success and rejects with Ollama's own message on any failure.
   *
   * @param {string} tag - Ollama model name, for example `qwen3:0.6b`.
   * @param {{ signal?: AbortSignal, onProgress?: (progress: object) => void }} [options]
   */
  async function pull(tag, options = {}) {
    const response = await fetch(`${base}/api/pull`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: tag, stream: true }),
      signal: options.signal,
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(`Ollama refused the download (HTTP ${response.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`)
    }
    const layers = new Map()
    let status = 'starting'
    for await (const line of readLines(response.body)) {
      let message
      try {
        message = JSON.parse(line)
      } catch {
        continue
      }
      if (typeof message?.error === 'string' && message.error.length > 0) throw new Error(message.error)
      if (typeof message?.status === 'string') status = message.status
      if (typeof message?.total === 'number' && typeof message?.completed === 'number' && message.total > 0) {
        layers.set(message.digest ?? `layer-${layers.size}`, {
          total: message.total,
          completed: message.completed,
        })
      }
      if (typeof options.onProgress === 'function') options.onProgress(progressOf(layers, status))
    }
    return progressOf(layers, 'success')
  }

  /** Delete one model from disk. */
  async function remove(tag) {
    const response = await fetch(`${base}/api/delete`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: tag }),
      signal: AbortSignal.timeout(20000),
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(`Ollama refused the removal (HTTP ${response.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`)
    }
  }

  return { base, version, list, pull, remove }
}

/** Turn one `/api/tags` row into the shape the card renders. */
function toModel(raw) {
  const details = raw?.details ?? {}
  const capabilities = Array.isArray(raw?.capabilities)
    ? raw.capabilities.filter((value) => KNOWN_CAPABILITIES.includes(value))
    : []
  const tag = String(raw?.model ?? raw?.name ?? '')
  return {
    tag,
    size: typeof raw?.size === 'number' ? raw.size : 0,
    family: typeof details.family === 'string' ? details.family : '',
    parameters: typeof details.parameter_size === 'string' ? details.parameter_size : '',
    quantization: typeof details.quantization_level === 'string' ? details.quantization_level : '',
    contextWindow: typeof details.context_length === 'number' ? details.context_length : 0,
    capabilities,
    modifiedAt: typeof raw?.modified_at === 'string' ? raw.modified_at : '',
    // A model that reports no capability list at all is assumed to be a chat model.
    chat: capabilities.length === 0 || capabilities.includes(CHAT_CAPABILITY),
  }
}

/** Sum the per-layer counters Ollama streams during a download. */
function progressOf(layers, status) {
  let total = 0
  let completed = 0
  for (const layer of layers.values()) {
    total += layer.total
    completed += layer.completed
  }
  return {
    status,
    completed,
    total,
    percent: total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0,
  }
}

/** Split a body of NDJSON into whole lines without buffering the whole response. */
async function* readLines(body) {
  if (body === null || body === undefined) return
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let index = buffer.indexOf('\n')
    while (index >= 0) {
      const line = buffer.slice(0, index).trim()
      buffer = buffer.slice(index + 1)
      if (line.length > 0) yield line
      index = buffer.indexOf('\n')
    }
  }
  const tail = `${buffer}${decoder.decode()}`.trim()
  if (tail.length > 0) yield tail
}
