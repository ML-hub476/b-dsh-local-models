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

You need **one thing**: the folder address (the "path") of a package on your computer.

1. Download this project (**Code** → **Download ZIP**), then unzip it. Or clone it with git.
2. Open the `packages` folder inside it. Pick **`b-1003-local-models-bundle`** — that one installs
   everything.
3. Copy that folder's path and run:

```sh
dsh plugin --profile desktop add "/Users/YOUR-NAME/Downloads/b-dsh-local-models-main/packages/b-1003-local-models-bundle"
```

Replace the part in quotes with your own path.

**How to copy a path on macOS:** right-click the folder in Finder, hold `Option`, then choose
**Copy "…" as Pathname**. On Windows: hold `Shift`, right-click the folder, choose
**Copy as path**.

> A "path" is just the address of a folder, written out: `卷/文件夹/子文件夹`, separated by `/`.
> If you see `/Users/…/packages/b-1003-local-models-bundle`, you have the right folder.

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

