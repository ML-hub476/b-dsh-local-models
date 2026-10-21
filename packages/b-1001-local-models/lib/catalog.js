/**
 * Online catalog for the Local models card.
 *
 * ollama.com publishes its searchable library as HTML. This module reads that
 * page, keeps only what the card shows, and caches one answer per query so
 * opening the card does not re-download the page.
 */

/** How long a cached answer stays fresh unless the caller forces a refresh. */
const DEFAULT_TTL_MS = 5 * 60 * 1000

/** Badge words Ollama prints under a model name. */
const CAPABILITY_BADGES = ['tools', 'thinking', 'vision', 'audio', 'embedding']

/** `0.6b`, `8b`, `1.5b`, `135m`. */
const SIZE_BADGE = /^\d+(?:\.\d+)?[bm]$/i

/** Rough download size of one billion Q4 parameters, in GB. */
const GB_PER_BILLION = 0.65

/**
 * @param {{ url?: string, ttlMs?: number, fetchImpl?: typeof fetch }} [options]
 */
export function createCatalog(options = {}) {
  const url = options.url ?? 'https://ollama.com/search'
  const ttlMs = Number.isFinite(options.ttlMs) ? options.ttlMs : DEFAULT_TTL_MS
  const fetchImpl = options.fetchImpl ?? fetch
  const cache = new Map()

  /**
   * Read the online list for one query. An empty query returns what Ollama
   * currently shows as the newest models.
   *
   * @param {string} query - free text typed by the user.
   * @param {{ force?: boolean }} [options]
   */
  async function search(query, options = {}) {
    const text = String(query ?? '').trim().slice(0, 80)
    const key = text.toLowerCase()
    const cached = cache.get(key)
    const now = Date.now()
    if (options.force !== true && cached !== undefined && now - cached.at < ttlMs) {
      return { ...cached.value, cached: true }
    }
    const target = text.length === 0 ? url : `${url}?q=${encodeURIComponent(text)}`
    try {
      const response = await fetchImpl(target, {
        headers: {
          accept: 'text/html',
          'user-agent': 'dsh-local-models/0.1.0 (+https://ollama.com)',
        },
        signal: AbortSignal.timeout(12000),
      })
      if (!response.ok) throw new Error(`ollama.com answered HTTP ${response.status}`)
      const html = await response.text()
      const value = {
        query: text,
        source: 'https://ollama.com/library',
        fetchedAt: now,
        items: parseSearchPage(html),
      }
      cache.set(key, { at: now, value })
      return { ...value, cached: false }
    } catch (error) {
      // A stale answer beats an empty card, so say it is stale instead of failing.
      if (cached !== undefined) {
        return { ...cached.value, cached: true, stale: true, warning: messageOf(error) }
      }
      throw new Error(`Could not reach ollama.com: ${messageOf(error)}`)
    }
  }

  /** How many distinct queries are cached; shown only for diagnostics. */
  function size() {
    return cache.size
  }

  return { search, size }
}

/**
 * Read one ollama.com search page. Every result is an `<li>` holding a link to
 * `/library/<name>`, an `<h2>` name, a `<p>` description, then badge spans.
 *
 * @param {string} html
 */
export function parseSearchPage(html) {
  const source = String(html ?? '')
  const items = []
  const seen = new Set()
  for (const chunk of source.split('<li')) {
    const link = /href="\/library\/([^"?#]+)"/.exec(chunk)
    if (link === null) continue
    const name = decodeEntities((/<h2[^>]*title="([^"]*)"/.exec(chunk) ?? [])[1] ?? link[1]).trim()
    if (name.length === 0 || seen.has(name)) continue
    if (/embed/i.test(name)) continue
    seen.add(name)
    const description = decodeEntities((/<p[^>]*title="([^"]*)"/.exec(chunk) ?? [])[1] ?? '').trim()
    const badges = []
    // Ollama wraps a download count in a span titled "... downloads" that also
    // holds an <svg>; only plain-text badge spans carry a capability or a size.
    for (const match of chunk.matchAll(/<span([^>]*)>([\s\S]*?)<\/span>/g)) {
      if (/title="[^"]*downloads/i.test(match[1])) continue
      if (match[2].includes('<')) continue
      const text = decodeEntities(match[2]).trim()
      if (text.length > 0) badges.push(text)
    }
    const capabilities = []
    const sizes = []
    for (const badge of badges) {
      const lower = badge.toLowerCase()
      if (CAPABILITY_BADGES.includes(lower) && !capabilities.includes(lower)) capabilities.push(lower)
      else if (SIZE_BADGE.test(lower) && !sizes.includes(lower)) sizes.push(lower)
    }
    items.push({
      name,
      description,
      capabilities,
      sizes,
      approxGB: approximateGB(sizes[0]),
    })
  }
  return items
}

/** Turn the smallest published size badge into a rough download size in GB. */
function approximateGB(badge) {
  if (typeof badge !== 'string') return 0
  const match = /^(\d+(?:\.\d+)?)([bm])$/i.exec(badge)
  if (match === null) return 0
  const amount = Number(match[1])
  if (!Number.isFinite(amount) || amount <= 0) return 0
  const billions = match[2].toLowerCase() === 'b' ? amount : amount / 1000
  return Math.round(billions * GB_PER_BILLION * 10) / 10
}

/** Decode the few entities an Ollama description can contain. */
function decodeEntities(text) {
  return String(text)
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&nbsp;', ' ')
}

/** Read a message out of an unknown thrown value. */
function messageOf(error) {
  if (error instanceof Error && error.message.length > 0) return error.message
  return String(error)
}
