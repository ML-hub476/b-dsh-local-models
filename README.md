# B · Local Models Kit for DeepSeek Harness

**English** | [简体中文](README.zh.md)

Run open-source models on your own computer: search Hugging Face, download a GGUF file, and pick
it in the model menu. **No Ollama, no LM Studio, no Python.** The engine ships with the plugin.

---

## What you get

| Code | Package | What it does |
|---|---|---|
| **B-1001** | `b-1001-local-engine` | The engine. Searches Hugging Face, downloads models into `~/.dsh/local-engine/models`, runs them with llama.cpp in a child process, and serves an OpenAI-compatible endpoint. |
| **B-1002** | `b-1002-local-models` | The card on **Settings → Models**. Engine status, your model shelf, Hugging Face search, your computer's CPU/memory/disk, fit marks, and a detail page with three suggested downloads. |
| **B-1003** | `b-1003-local-models-bundle` | The bundle. Installs B-1001 and B-1002 in one step — **install this one**. |

---

## Install

Takes about ten minutes. Every command below is meant to be copied as-is.

### 0. Check you have Node.js 20 or newer

```sh
node -v
```

If that prints `v20`, `v22`, `v24` or newer, you are fine. If it prints nothing, install Node from
<https://nodejs.org> and open a new terminal.

### 1. Get this repository

```sh
git clone https://github.com/ML-hub476/b-dsh-local-models.git
cd b-dsh-local-models
```

No git? Open the repository page, press **Code → Download ZIP**, unzip it, then `cd` into the
unzipped folder instead.

### 2. Install the engine library — **do not skip this**

```sh
npm install node-llama-cpp
```

This downloads the llama.cpp binary for your computer (about 20 MB). It is a separate step because
the plugin is installed from a folder, and a folder install does not pull its dependencies.

### 3. Find your profile name

```sh
ls ~/.dsh/profiles
```

You will usually see `web` (if you start the app with `npx @deepseek-ai/dsh web`) or `desktop`
(if you use the desktop app). Use whatever name appears here in the next command.

### 4. Install the plugin

```sh
npx @deepseek-ai/dsh plugin --profile web add "$PWD/packages/b-1003-local-models-bundle"
```

Replace `web` with the name from step 3.

> Using the **desktop app** instead of npx? The command is
> `dsh plugin --profile desktop add "$PWD/packages/b-1003-local-models-bundle"`.

### 5. Restart the app

Stop the running terminal with `Ctrl+C`, then start it again:

```sh
npx @deepseek-ai/dsh web
```

### 6. Download your first model

1. Open the web page and go to **Settings → Models**.
2. Find **B-1001 Your own engine** and press **Start engine** (it needs one model first, so skip
   to step 3 if it says there is no model).
3. In **Find models on Hugging Face**, search `qwen3`.
4. Open a result, choose **Quality**, **Balanced** or **Compact**, and press **Download**.
5. Press **Use**.
6. In the chat box, open the model menu and pick the model under **Local (built-in)**.

---

## How the fit marks work

```
need = file size × 1.2 + 1.5 GB        (weights + context + a safety margin)
need ≤ 70% of memory  → Fits well
need ≤ 90% of memory  → Tight fit
otherwise             → Too big
```

The three suggestions on each model page mean:

| Label | Rule |
|---|---|
| **Quality** | the largest file that still runs on this computer |
| **Balanced** | the Q4 family — the usual sweet spot |
| **Compact** | the smallest file still worth running |

---

## Troubleshooting

| What you see | What to do |
|---|---|
| `zsh: command not found: dsh` | There is no global `dsh` command. Use `npx @deepseek-ai/dsh …` instead. |
| `Cannot find package 'node-llama-cpp'` | Step 2 was skipped. Run `npm install node-llama-cpp` in the repository folder. |
| Engine says *error*, message mentions **code signature** or **Team IDs** | Your Node is the official signed build. Install a different one: `brew install node`, then start with `B1001_NODE=/opt/homebrew/bin/node npx @deepseek-ai/dsh web`. |
| Engine never says **Running** | Check `node -v` is 20+. A model has to be downloaded before the engine can start. |
| Model answers slowly, computer swaps | Pick **Compact**, or choose a smaller model. |
| Plugin not listed after install | Restart the app (step 5); check the profile name in step 3. |

---

## Known limitations

- **GGUF only.** MLX and Safetensors are not supported.
- **A Node on `PATH` is required** that can load native modules. Apple's signed builds cannot, so
  Homebrew or nvm Node is the reliable choice on macOS.
- **One model at a time.** The engine holds a single model in memory.
- **Capabilities are inferred.** Hugging Face does not label "tool use" or "reasoning", so those
  chips come from the repository name and tags, and the detail page says so.

---

## Layout

```
packages/
  b-1001-local-engine/          the engine (host only)
  b-1002-local-models/          the card (client only)
  b-1003-local-models-bundle/   the bundle that installs both
```

## License

MIT — see [LICENSE](LICENSE).
