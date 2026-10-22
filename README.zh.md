# B · DeepSeek Harness 本地模型套件

[English](README.md) | **简体中文**

在自己的电脑上运行开源模型：在 Hugging Face 上查找、下载，然后在模型菜单里选用。无需安装任何外部引擎。

每个包都带一个 **B 编号**。编号就是标签——它会出现在 Harness 界面里的插件名、README 和发布标签中。

| 编号 | 包 | 作用 |
|---|---|---|
| **B-1001** | `@ml-hub476/b-1001-local-engine` | 引擎：搜索 Hugging Face，把 GGUF 下载到 `~/.dsh/local-engine/models`，在子进程中运行，并提供 OpenAI 兼容接口。 |
| **B-1002** | `@ml-hub476/b-1002-local-models` | “设置 → 模型”页上的卡片：引擎状态、模型列表、Hugging Face 搜索、本机配置、适配标记，以及类似 LM Studio 的详情页（三个推荐下载）。 |
| **B-1003** | `@ml-hub476/b-1003-local-models-bundle` | 套件：一次性安装 B-1001 与 B-1002。 |

## 安装

你只需要一样东西：某个包文件夹在电脑上的**地址（路径）**。

1. 下载这个项目（点绿色 **Code** → **Download ZIP**），然后解压；或者用 git 克隆。
2. 打开里面的 `packages` 文件夹，选 **`b-1003-local-models-bundle`**——装它一个就够了。
3. 复制这个文件夹的路径，然后运行：

```sh
dsh plugin --profile desktop add "/Users/你的名字/Downloads/b-dsh-local-models-main/packages/b-1003-local-models-bundle"
```

把引号里的部分换成你自己的路径。

**macOS 怎么复制路径：** 在访达里右键这个文件夹，按住 `Option`，选 **拷贝"…"为路径名**。
Windows：按住 `Shift` 右键文件夹，选 **复制为路径**。

> 所谓"路径"就是文件夹的地址，用 `/` 一层层写出来：`磁盘/文件夹/子文件夹`。
> 如果你看到的是 `/Users/…/packages/b-1003-local-models-bundle`，那就对了。

## 使用

1. 打开 **设置 → 模型**。
2. 在 Hugging Face 搜索模型，例如 `qwen3`。
3. 打开它，选择 **Quality / Balanced / Compact** 之一并下载。
4. 点 **使用**，然后在聊天框的模型菜单里选 **Local (built-in)**。

## 适配标记怎么算

```
需要 = 文件大小 × 1.2 + 1.5 GB        （权重 + 上下文 + 余量）
需要 ≤ 内存的 70%  → 跑得动
需要 ≤ 内存的 90%  → 勉强够用
否则              → 太大了
```

## 目录结构

```
packages/
  b-1001-local-engine/          引擎（仅 Host）
  b-1002-local-models/          卡片（仅 Client）
  b-1003-local-models-bundle/   一次装好两者的套件
```

## 环境要求

- DeepSeek Harness
- PATH 上有 Node.js 20 或更新版本——引擎用它单独运行 llama.cpp
- macOS / Linux / Windows；Apple 芯片会自动用 Metal 加速

## 许可

MIT —— 见 [LICENSE](LICENSE)。
