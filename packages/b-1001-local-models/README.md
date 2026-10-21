# B-1001 · Local Models

A **Local models** card on **Settings → Models**. It reads what this computer has, marks which
open-source models fit, downloads the one you click, and puts it in the model menu.

No API key, no config file, no terminal.

## What the card shows

1. **This computer** — CPU model and core count, total and free memory, free disk space.
   These numbers drive everything else on the card.
2. **Fit marks** — every model gets one of three verdicts, worked out from its download size
   against your memory:

   ```
   need = size × 1.2 + 1.5 GB          (weights + the context kept in memory + overhead)
   need ≤ 70% of memory  → Fits well
   need ≤ 90% of memory  → Tight fit
   otherwise             → Too big
   ```

   On a 24 GB Mac that means roughly anything up to 12 GB of weights is comfortable.

3. **Click a model for its details** — parameter count, quantization, context window,
   download size, capabilities (tools / thinking / vision), the memory estimate, and, for
   online models, the description from ollama.com.
4. **Download with live progress** — percent, bytes, current phase, and **Cancel**.
5. **One click to use it** — *Use as default* makes new sessions start on that model, which is
   what removes the "no model, no API key" wall.

## How it is built

```
client.js          browser half: the card, in the settings.models.footer slot
index.js           host half: /local-models/* on the existing Web server
lib/ollama.js      Ollama HTTP client (version, tags, pull, delete)
lib/catalog.js     ollama.com search page → catalog rows, cached per query
cordis.patch.yml   inserts the single row `b-1001-local-models`
```

- **No runtime dependencies** — Node's global `fetch`, the browser's `fetch`, and built-in
  `node:os` / `node:fs` only.
- **Same-origin** — the card calls `/local-models/*` on the Harness Web server, guarded by a
  custom header and an origin check.
- **Model-menu wiring** — after each download the host writes a `local` route into
  `llm-pi-ai` through `ctx.configEditor.edit`, rewriting only that one key. Other providers
  in the profile are left exactly as they were.
- **Theme tokens only** — every colour is a `--dsw-*` variable, so light and dark both work.

## Endpoints

| Method | Path | Meaning |
|---|---|---|
| GET | `/local-models/state` | system facts + Ollama health + installed models + job + default model |
| GET | `/local-models/catalog?q=&force=1` | online model list (cached 5 minutes) |
| POST | `/local-models/download` `{tag, makeDefault}` | start one download |
| GET | `/local-models/download` | current job and progress |
| POST | `/local-models/cancel` | cancel the running download |
| POST | `/local-models/remove` `{tag}` | delete a model and re-sync the route |
| POST | `/local-models/default` `{tag}` | make it the default model |
| POST | `/local-models/sync` | rewrite the `local` route from installed models |

## Requirements

- Ollama running on `http://127.0.0.1:11434` (`ollama serve`, or the Ollama app).
- The `llm-pi-ai` plugin active in the profile — it ships with the Harness Web app.

B-1002 will remove the Ollama requirement.

## Install & uninstall

```sh
dsh plugin --profile desktop add /path/to/packages/b-1001-local-models
dsh plugin --profile desktop remove @ml-hub476/b-1001-local-models
```

Removing the plugin leaves the downloaded models on disk. Delete the `local` provider from
`llm-pi-ai` in `cordis.patch.yml` if you also want it out of the model menu.

## License

MIT © Bing Dai
