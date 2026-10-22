/**
 * B-1001 Local Engine — the worker.
 *
 * Runs llama.cpp through node-llama-cpp and serves an OpenAI-compatible
 * endpoint on loopback, so the Harness reaches it exactly like any other
 * provider. It is deliberately a separate process: the model lives and dies
 * here, and a crash cannot take the Host down with it.
 *
 * Environment:
 *   B1001_MODEL_PATH  absolute path to a .gguf file (required)
 *   B1001_CONTEXT     context size in tokens (default 4096)
 *   B1001_PORT        port to bind; 0 asks the OS (default 0)
 *   B1001_NAME        model id reported to the Harness (default: file name)
 *
 * The ready line on stdout is `READY <port>`.
 */
import { appendFileSync } from 'node:fs'
import http from 'node:http'
import { homedir } from 'node:os'
import { basename, join } from 'node:path'

import { getLlama, LlamaChatSession } from 'node-llama-cpp'

const modelPath = process.env.B1001_MODEL_PATH
const contextSize = Number(process.env.B1001_CONTEXT ?? 4096) || 4096
const requestedPort = Number(process.env.B1001_PORT ?? 0)
const modelName = process.env.B1001_NAME ?? (modelPath ? basename(modelPath) : 'local')

/** One line per request, so a failed turn can be explained afterwards. */
const LOG_FILE = join(homedir(), '.dsh', 'local-engine', 'engine.log')
function log(line) {
  try {
    appendFileSync(LOG_FILE, `${new Date().toISOString()} ${line}\n`)
  } catch {
    /* logging must never break a request */
  }
}

if (typeof modelPath !== 'string' || modelPath.length === 0) {
  process.stderr.write('B1001_MODEL_PATH is required\n')
  process.exit(2)
}

const llama = await getLlama()
const model = await llama.loadModel({ modelPath })
const context = await model.createContext({ contextSize })
const session = new LlamaChatSession({ contextSequence: context.getSequence() })

/** One request at a time: a single sequence cannot serve two prompts at once. */
let queue = Promise.resolve()
function serialized(task) {
  const run = queue.then(task, task)
  queue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

/**
 * Turn OpenAI messages into a chat history plus the final user turn.
 *
 * DSH replays the whole session: this conversation arrived as 697 messages and
 * 1.7 MB. Only the tail fits in a small context, and `LlamaChatSession` accepts
 * user/model turns only, so system text is folded into the prompt instead.
 */
function splitMessages(messages) {
  const list = Array.isArray(messages) ? messages : []
  const system = []
  const turns = []
  for (const message of list) {
    const role = String(message?.role ?? '')
    const text = contentToText(message?.content)
    if (text.length === 0) continue
    if (role === 'system' || role === 'developer') system.push(text)
    else if (role === 'user') turns.push({ type: 'user', text })
    else if (role === 'assistant') turns.push({ type: 'model', text })
  }
  const last = turns.length > 0 ? turns[turns.length - 1] : null
  const lastIsUser = last !== null && last.type === 'user'
  const prompt = lastIsUser ? last.text : ''
  const history = lastIsUser ? turns.slice(0, -1) : turns

  // Keep only what fits: the newest ten turns, at most twelve thousand characters.
  const kept = []
  let chars = 0
  for (let index = history.length - 1; index >= 0; index -= 1) {
    chars += history[index].text.length
    if (kept.length >= 10 || chars > 12000) break
    kept.unshift(history[index])
  }

  const instructions = system.length > 0 ? system[system.length - 1].slice(-6000) : ''
  const first = kept[0]
  if (instructions.length > 0 && first !== undefined && first.type === 'user') {
    kept[0] = { type: 'user', text: `${instructions}\n\n${first.text}` }
  }
  const finalPrompt = instructions.length > 0 && kept.length === 0 ? `${instructions}\n\n${prompt}` : prompt
  return { history: kept, prompt: finalPrompt }
}

function contentToText(content) {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'string' ? part : typeof part?.text === 'string' ? part.text : ''))
      .filter((part) => part.length > 0)
      .join('\n')
  }
  return ''
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let bytes = 0
    request.on('data', (chunk) => {
      bytes += chunk.length
      if (bytes > 32 * 1024 * 1024) {
        reject(new Error('Request body is too large'))
        request.destroy()
        return
      }
      chunks.push(chunk)
    })
    request.on('end', () => {
      try {
        resolve(chunks.length === 0 ? {} : JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch (error) {
        reject(new Error('Request body is not valid JSON'))
      }
    })
    request.on('error', reject)
  })
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

function messageId() {
  return `chatcmpl-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1')

  if (request.method === 'GET' && (url.pathname === '/v1/models' || url.pathname === '/models')) {
    return sendJson(response, 200, {
      object: 'list',
      data: [{ id: modelName, object: 'model', owned_by: 'b-1001-local-engine' }],
    })
  }

  if (request.method === 'GET' && url.pathname === '/health') {
    return sendJson(response, 200, { ok: true, model: modelName, contextSize })
  }

  if (request.method !== 'POST' || url.pathname !== '/v1/chat/completions') {
    return sendJson(response, 404, { error: { message: `No route for ${request.method} ${url.pathname}` } })
  }

  let body
  try {
    body = await readBody(request)
  } catch (error) {
    return sendJson(response, 400, { error: { message: String(error.message) } })
  }

  const requestChars = JSON.stringify(body.messages ?? []).length
  const toolCount = Array.isArray(body.tools) ? body.tools.length : 0
  log(`REQ messages=${(body.messages ?? []).length} chars=${requestChars} tools=${toolCount} stream=${body.stream === true}`)
  const { history, prompt } = splitMessages(body.messages)
  if (prompt.length === 0) {
    return sendJson(response, 400, { error: { message: 'The last message must be a user message with text.' } })
  }

  try {
    await serialized(async () => {
      const transcript = [
        ...history.map((turn) => `${turn.type === 'user' ? 'User' : 'Assistant'}: ${turn.text}`),
        `User: ${prompt}`,
        'Assistant:',
      ].join('\n')
      const id = messageId()
      const created = Math.floor(Date.now() / 1000)
      if (body.stream === true) {
        response.writeHead(200, {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache, no-store',
          connection: 'keep-alive',
        })
        const frame = (delta, finish) =>
          `data: ${JSON.stringify({
            id,
            object: 'chat.completion.chunk',
            created,
            model: modelName,
            choices: [{ index: 0, delta, finish_reason: finish ?? null }],
          })}\n\n`
        response.write(frame({ role: 'assistant' }))
        let chars = 0
        const started = Date.now()
        await session.prompt(transcript, {
          onTextChunk(chunk) {
            chars += chunk.length
            if (chunk.length > 0) response.write(frame({ content: chunk }))
          },
        })
        log(`DONE chars=${chars} ms=${Date.now() - started}`)
        response.write(frame({}, 'stop'))
        response.write('data: [DONE]\n\n')
        response.end()
        return
      }
      const text = await session.prompt(transcript)
      sendJson(response, 200, {
        id,
        object: 'chat.completion',
        created,
        model: modelName,
        choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
      })
    })
  } catch (error) {
    log(`ERR ${String(error?.message ?? error).slice(0, 400)}`)
    if (!response.headersSent) return sendJson(response, 500, { error: { message: String(error?.message ?? error) } })
    response.end()
  }
})

server.listen(requestedPort, '127.0.0.1', () => {
  const address = server.address()
  process.stdout.write(`READY ${address.port}\n`)
})

function shutdown() {
  server.close(() => {
    void context.dispose?.()
    void model.dispose?.()
    process.exit(0)
  })
  setTimeout(() => process.exit(0), 2000).unref()
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
