# B-1002 · Local Models

**English** | [简体中文](README.zh.md)
The card on **Settings → Models**. It is the face of B-1001: your engine's status, the models it
owns, a Hugging Face search box, and what this computer can run.

B-1002 has no host state and no dependencies — every call goes to `/local-engine/*` on B-1001.

## What the card shows

1. **Your own engine** — running or not, which model, which port, with **Start / Stop** and
   **Make this my default model**.
2. **This computer** — CPU, core count, memory and free disk, read from the machine.
3. **Your engine's models** — every GGUF in `~/.dsh/local-engine/models`, with size, a fit mark,
   **Use** and **Remove**.
4. **Find models on Hugging Face** — search GGUF repositories, choose one, pick a quantization,
   download with a live progress bar.

## Fit marks

```
need = file size × 1.2 + 1.5 GB        (weights + context + overhead)
need ≤ 70% of memory  → Fits well
need ≤ 90% of memory  → Tight fit
otherwise             → Too big
```

## Install

```sh
dsh plugin --profile desktop add /path/to/packages/b-1001-local-engine
dsh plugin --profile desktop add /path/to/packages/b-1002-local-models
```

## License

MIT © Bing Dai
