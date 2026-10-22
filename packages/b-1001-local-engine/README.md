# B-1001 · Local Engine

**English** | [简体中文](README.zh.md)
Finds a GGUF model on Hugging Face, downloads it into its own folder, runs it in a child
process, and serves an OpenAI-compatible endpoint the Harness reaches like any provider.

Nothing external is required.

## What it does

| Step | Where |
|---|---|
| Search models | `GET /local-engine/hub/search?q=` → Hugging Face GGUF repositories |
| Pick a file | `GET /local-engine/hub/files?repo=` → files, license, recommended quant |
| Download | `POST /local-engine/hub/download` `{repo,file}` → resumable, with progress |
| Store | `~/.dsh/local-engine/models` |
| Run | `POST /local-engine/use` `{file}` → restarts the engine on that model |
| Be selectable | registers the `local-builtin` route in `llm-pi-ai` |
| Set default | `POST /local-engine/default` `{}` |

Other routes: `GET /state`, `POST /start`, `POST /stop`, `GET /models`, `GET /system`.

## Why a child process

The Harness ships a hardened-runtime Node signed by DeepSeek. macOS refuses to load a native
addon signed by anyone else, so llama.cpp cannot run inside the Host process. The worker runs
under a separate Node found on `PATH` (override with `B1001_NODE`). That also keeps a model
crash away from your session.

## Configuration

| Key | Meaning |
|---|---|
| `modelPath` | absolute path to a `.gguf`; `~/` is expanded. Empty = mount without starting |
| `contextSize` | context window in tokens (default 8192) |
| `port` | fixed listen port (default 18111) so a written route survives restarts |
| `displayName` | label in the model menu |

## License

MIT © Bing Dai

See the [root README](../../README.md#install) for the step-by-step version, including how to find the path.
