# B — Local Model Kit for DeepSeek Harness

Open-source models you can download, match to your computer, and pick in the model menu —
without editing a config file.

Every package in this repository carries a **B-code**. The code is the label: it appears in the
plugin name in the Harness UI, in the README, and in the release tag.

| Code | Package | What it is | State |
|---|---|---|---|
| **B-1001** | `@ml-hub476/b-1001-local-engine` | The **engine that replaces Ollama**: searches Hugging Face, downloads GGUF files into its own folder, runs them in a child process and serves an OpenAI-compatible endpoint. | ✅ runs |
| **B-1002** | `@ml-hub476/b-1002-local-models` | The **one-button card** on Settings → Models: engine status, the engine's model shelf, Hugging Face search, CPU/memory/disk facts and fit marks. Ollama is a folded-away extra. | ✅ shipped |
| **B-1003** | `@ml-hub476/b-1003-local-models-bundle` | The **one-click bundle** that switches on B-1001 and B-1002 together. | 🧱 next |

Package names, titles and folder names all carry the same code, so a plugin row, a README
heading and a release tag always agree.

## Install

```sh
dsh plugin --profile <name> add <path-or-spec>
```

Or, from a Harness session, install the package directory directly. B-1001 needs only the
Harness and a running [Ollama](https://ollama.com) on `http://127.0.0.1:11434`.

B-1002 will need neither.

## Why Ollama first, engine second

Ollama is a proven engine that already owns model loading, chat templates and context limits.
That makes B-1001 small, dependency-free, and installable in about a second.

B-1002 removes the external dependency by running llama.cpp inside a child process and
speaking the same OpenAI-compatible protocol, so the card does not change when the engine
switches. It carries the heavier dependency, which is exactly why it is a separate package.

## Layout

```
packages/
  b-1001-local-engine/     the built-in engine (llama.cpp in a child process)
  b-1002-local-models/     the card (client + host halves, no runtime dependencies)
```

## License

MIT © Bing Dai
