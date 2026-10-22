# B · Local Models Kit for DeepSeek Harness

**English** | [简体中文](README.zh.md)

Run open-source models on your own machine: find one on Hugging Face, download it, pick it in the
model menu. No external engine to install.

Every package carries a **B-code**. The code is the label — it shows in the plugin name inside the
Harness UI, in the README, and in the release tag.

| Code | Package | What it is |
|---|---|---|
| **B-1001** | `@ml-hub476/b-1001-local-engine` | The engine: searches Hugging Face, downloads GGUF files into `~/.dsh/local-engine/models`, runs them in a child process and serves an OpenAI-compatible endpoint. |
| **B-1002** | `@ml-hub476/b-1002-local-models` | The card on **Settings → Models**: engine status, the model shelf, Hugging Face search, computer facts, fit marks, and an LM Studio-style detail page with three suggested downloads. |
| **B-1003** | `@ml-hub476/b-1003-local-models-bundle` | The bundle: installs B-1001 and B-1002 as one plugin. |

## Install

```sh
dsh plugin --profile desktop add <path-to-package>
```

Install **B-1003** to get the whole family in one step.

## Usage

1. Open **Settings → Models**.
2. Search a model on Hugging Face, for example `qwen3`.
3. Open it, choose **Quality**, **Balanced** or **Compact**, and download.
4. Press **Use**, then pick the model in the chat box under **Local (built-in)**.

## How fit marks are worked out

```
need = file size × 1.2 + 1.5 GB        (weights + context + overhead)
need ≤ 70% of memory  → Fits well
need ≤ 90% of memory  → Tight fit
otherwise             → Too big
```

## Layout

```
packages/
  b-1001-local-engine/          the engine (host only)
  b-1002-local-models/          the card (client only)
  b-1003-local-models-bundle/   the bundle that installs both
```

## Requirements

- DeepSeek Harness
- Node.js 20 or newer on `PATH` — the engine runs llama.cpp in its own process
- macOS, Linux or Windows; Apple silicon gets Metal acceleration

## License

MIT — see [LICENSE](LICENSE).

