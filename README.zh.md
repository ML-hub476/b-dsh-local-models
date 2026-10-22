# B · Local Models Kit for DeepSeek Harness

Run open-source models on your own machine: find one on Hugging Face, download it, click it in the
model menu. No external engine to install.

Every package carries a **B-code**. The code is the label — it shows in the plugin name in the
Harness UI, in the README and in the release tag.

| Code | Package | What it is |
|---|---|---|
| **B-1001** | `@ml-hub476/b-1001-local-engine` | The engine: searches Hugging Face, downloads GGUF files into `~/.dsh/local-engine/models`, runs them in a child process and serves an OpenAI-compatible endpoint. |
| **B-1002** | `@ml-hub476/b-1002-local-models` | The card on **Settings → Models**: engine status, the model shelf, Hugging Face search, computer facts, fit marks, and an LM Studio-style detail page with three suggested downloads. |
| **B-1003** | `@ml-hub476/b-1003-local-models-bundle` | The bundle: installs B-1001 and B-1002 as one plugin. |

## Install

One package:

```sh
dsh plugin --profile desktop add <path-or-package>
```

Or the whole family at once with **B-1003**, which owns both rows.

## Layout

```
packages/
  b-1001-local-engine/          the engine (host only)
  b-1002-local-models/          the card (client only)
  b-1003-local-models-bundle/   the bundle that installs both
```

## 简体中文

运行开源模型：在 Hugging Face 上查找、下载到本机，然后在模型菜单里选用。无需安装任何外部引擎。

| 编号 | 包 | 作用 |
|---|---|---|
| **B-1001** | `@ml-hub476/b-1001-local-engine` | 引擎：搜索 Hugging Face、把 GGUF 下载到 `~/.dsh/local-engine/models`、在子进程中运行并提供 OpenAI 兼容接口。 |
| **B-1002** | `@ml-hub476/b-1002-local-models` | “设置 → 模型”页上的卡片：引擎状态、模型列表、Hugging Face 搜索、本机配置、适配标记，以及类似 LM Studio 的详情页（三个推荐下载）。 |
| **B-1003** | `@ml-hub476/b-1003-local-models-bundle` | 套件：一次性安装 B-1001 与 B-1002。 |

## License

MIT © Bing Dai
