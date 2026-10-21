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
import http from 'node:http'
import { basename } from 'node:path'

import { getLlama, LlamaChatSession } from 'node-llama-cpp'

const modelPath = process.env.B1001_MODEL_PATH
const contextSize = Number(process.env.B1001_CONTEXT ?? 4096) || 4096
const requestedPort = Number(process.env.B1001_PORT ?? 0)
const modelName = process.env.B1001_NAME ?? (modelPath ? basename(modelPath) : 'local')

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

/** Turn OpenAI messages into a chat history plus the final user turn. */
function splitMessages(messages) {
  const list = Array.isArray(messages) ? messages : []
  const history = []
  for (const message of list) {
    const role = String(message?.role ?? '')
    const text = contentToText(message?.content)
    if (text.length === 0) continue
    if (role === 'assistant') history.push({ type: 'model', text })
    else if (role === 'user') history.push({ type: 'user', text })
    else if (role === 'system') history.push({ type: 'system', text })
  }
  const last = history.length > 0 ? history[history.length - 1] : null
  if (last === null || last.type !== 'user') return { history, prompt: '' }
  return { history: history.slice(0, -1), prompt: last.text }
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

  const { history, prompt } = splitMessages(body.messages)
  if (prompt.length === 0) {
    return sendJson(response, 400, { error: { message: 'The last message must be a user message with text.' } })
  }

  try {
    await serialized(async () => {
      session.setChatHistory(history)
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
        await session.prompt(prompt, {
          onTextChunk(chunk) {
            if (chunk.length > 0) response.write(frame({ content: chunk }))
          },
        })
        response.write(frame({}, 'stop'))
        response.write('data: [DONE]\n\n')
        response.end()
        return
      }
      const text = await session.prompt(prompt)
      sendJson(response, 200, {
        id,
        object: 'chat.completion',
        created,
        model: modelName,
        choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
      })
    })
  } catch (error) {
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
