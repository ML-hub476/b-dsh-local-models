/**
 * Hugging Face access for B-1001: find a model, pick a GGUF file, download it
 * into the engine's own folder. Zero dependencies — global fetch and streams.
 */
import { createWriteStream } from 'node:fs'
import { mkdir, rename, rm, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const HF = 'https://huggingface.co'

/** Quantizations worth offering, best first for a laptop. */
const PREFERRED_QUANTS = ['Q4_K_M', 'Q4_K_S', 'Q5_K_M', 'Q3_K_M', 'Q8_0', 'Q6_K']

/** Search GGUF repositories, most downloaded first. */
export async function searchModels(query, limit = 24) {
  const text = String(query ?? '').trim().slice(0, 80)
  const url = `${HF}/api/models?search=${encodeURIComponent(text)}&filter=gguf&sort=downloads&direction=-1&limit=${limit}&expand[]=lastModified&expand[]=tags`
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'b-1001-local-engine/0.1.0' },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`Hugging Face answered HTTP ${response.status}`)
  const rows = await response.json()
  const items = (Array.isArray(rows) ? rows : []).map((row) => {
    const repo = String(row.id ?? row.modelId ?? '')
    const tags = Array.isArray(row.tags) ? row.tags.map(String) : []
    return {
      repo,
      downloads: typeof row.downloads === 'number' ? row.downloads : 0,
      updated: String(row.lastModified ?? ''),
      gated: row.gated === true || row.gated === 'auto' || row.gated === 'manual',
      capabilities: capabilitiesOf(repo, tags),
      sizeBytes: 0,
      license: licenseOf(tags),
    }
  }).filter((item) => item.repo.length > 0)

  // Sizes decide the fit mark, so the first few results are inspected in parallel.
  const enriched = await Promise.all(items.slice(0, 8).map(async (item) => {
    try {
      const files = await listFiles(item.repo)
      return { ...item, sizeBytes: files.recommendedSize, capabilities: files.capabilities, license: files.license }
    } catch {
      return item
    }
  }))
  return [...enriched, ...items.slice(8)]
}

/** Capabilities Hugging Face does not label, inferred from name and tags. */
export function capabilitiesOf(repo, tags = []) {
  const haystack = `${repo} ${tags.join(' ')}`.toLowerCase()
  const found = []
  if (/image-text-to-text|image-to-text|visual-question|vision|\bvl\b|llava|minicpm-v/.test(haystack)) found.push('vision')
  if (/tool|function-call|agent/.test(haystack)) found.push('tools')
  if (/reason|think|r1-|distill|chain-of-thought|\br1\b/.test(haystack)) found.push('reasoning')
  if (/code|coder/.test(haystack)) found.push('code')
  return found
}

function licenseOf(tags) {
  const entry = (tags ?? []).find((tag) => String(tag).startsWith('license:'))
  return entry === undefined ? 'unknown' : String(entry).slice('license:'.length)
}

/** List the GGUF files in one repository, smallest quant first for the pick. */
export async function listFiles(repo) {
  const url = `${HF}/api/models/${String(repo).split('/').map(encodeURIComponent).join('/')}?blobs=true`
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'b-1001-local-engine/0.1.0' },
    signal: AbortSignal.timeout(20000),
  })
  if (!response.ok) throw new Error(`Hugging Face answered HTTP ${response.status}`)
  const body = await response.json()
  const tags = Array.isArray(body.tags) ? body.tags.map(String) : []
  const files = (Array.isArray(body.siblings) ? body.siblings : [])
    .filter((sibling) => String(sibling.rfilename ?? '').toLowerCase().endsWith('.gguf'))
    .map((sibling) => ({ name: String(sibling.rfilename), size: Number(sibling.size) || 0 }))
  if (files.length === 0) throw new Error('This repository has no .gguf file.')
  const rank = (name) => {
    const index = PREFERRED_QUANTS.findIndex((quant) => name.toUpperCase().includes(quant))
    return index < 0 ? PREFERRED_QUANTS.length : index
  }
  const sorted = files.sort((a, b) => rank(a.name) - rank(b.name) || a.size - b.size)
  return {
    repo: String(body.id ?? body.modelId ?? repo),
    gated: body.gated === true || body.gated === 'auto' || body.gated === 'manual',
    license: String(body.cardData?.license ?? licenseOf(tags)),
    updated: String(body.lastModified ?? ''),
    capabilities: capabilitiesOf(repo, tags),
    files: sorted,
    recommended: sorted[0]?.name ?? '',
    recommendedSize: sorted[0]?.size ?? 0,
  }
}

/** A file name that is safe on disk and still says which repository it came from. */
export function localName(repo, file) {
  const flat = `${repo}--${file}`.replace(/[^A-Za-z0-9._-]+/g, '_')
  return flat.length > 180 ? `${flat.slice(0, 170)}${file.slice(-9)}` : flat
}

/** Size of one remote file, read from a ranged request so nothing is downloaded. */
export async function remoteSize(repo, file) {
  const url = `${HF}/${String(repo).split('/').map(encodeURIComponent).join('/')}/resolve/main/${String(file).split('/').map(encodeURIComponent).join('/')}`
  const response = await fetch(url, {
    headers: { range: 'bytes=0-0', 'user-agent': 'b-1001-local-engine/0.1.0' },
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  })
  if (response.status !== 206 && !response.ok) throw new Error(`Hugging Face answered HTTP ${response.status}`)
  const range = response.headers.get('content-range') ?? ''
  const total = /bytes \d+-\d+\/(\d+)/.exec(range)
  await response.body?.cancel().catch(() => {})
  return total === null ? 0 : Number(total[1])
}

/**
 * Download one file, resuming a previous attempt when a partial file is there.
 * `onProgress({received, total, percent})` is called as bytes arrive.
 */
export async function downloadFile(repo, file, targetPath, onProgress, signal) {
  await mkdir(dirname(targetPath), { recursive: true })
  const partial = `${targetPath}.part`
  let offset = 0
  try {
    offset = (await stat(partial)).size
  } catch {
    offset = 0
  }
  const url = `${HF}/${String(repo).split('/').map(encodeURIComponent).join('/')}/resolve/main/${String(file).split('/').map(encodeURIComponent).join('/')}`
  const headers = { 'user-agent': 'b-1001-local-engine/0.1.0' }
  if (offset > 0) headers.range = `bytes=${offset}-`
  const response = await fetch(url, { headers, redirect: 'follow', signal })
  if (!response.ok && response.status !== 206) throw new Error(`Hugging Face answered HTTP ${response.status}`)
  if (offset > 0 && response.status !== 206) offset = 0
  const length = Number(response.headers.get('content-length') ?? 0)
  const total = length + offset
  if (onProgress) onProgress({ received: offset, total, percent: total > 0 ? Math.round((offset / total) * 100) : 0 })
  let received = offset
  const sink = createWriteStream(partial, { flags: offset > 0 ? 'a' : 'w' })
  const source = Readable.fromWeb(response.body)
  source.on('data', (chunk) => {
    received += chunk.length
    if (onProgress) onProgress({ received, total, percent: total > 0 ? Math.round((received / total) * 100) : 0 })
  })
  await pipeline(source, sink)
  await rename(partial, targetPath)
  return { path: targetPath, bytes: received }
}

/** Remove a downloaded model, if it is there. */
export async function removeFile(targetPath) {
  await rm(targetPath, { force: true })
  await rm(`${targetPath}.part`, { force: true })
}

/** Where a downloaded model lives. */
export function modelPathFor(modelDir, repo, file) {
  return join(modelDir, localName(repo, file))
}
