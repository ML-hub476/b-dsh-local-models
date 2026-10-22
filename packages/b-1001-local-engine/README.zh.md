# B-1001 · 本地引擎

在 Hugging Face 上查找 GGUF 模型，下载到自己的目录，在子进程中运行，并提供 OpenAI 兼容接口，
Harness 可以像任何其他服务商一样接入。无需任何外部依赖。

## 它能做什么

| 步骤 | 接口 |
|---|---|
| 搜索模型 | `GET /local-engine/hub/search?q=` |
| 查看文件 | `GET /local-engine/hub/detail?repo=` |
| 下载 | `POST /local-engine/hub/download` `{repo,file}`，支持断点续传与进度 |
| 保存 | `~/.dsh/local-engine/models` |
| 运行 | `POST /local-engine/use` `{file}` |
| 出现在菜单 | 注册 `local-builtin` 路由 |
| 设为默认 | `POST /local-engine/default` `{}` |

其他接口：`GET /state`、`POST /start`、`POST /stop`、`GET /models`、`GET /system`。

## 为什么用子进程

Harness 自带的是经过加固运行时的 Node（带 Apple 签名），macOS 不允许加载其他签名的原生模块。
因此 llama.cpp 必须在单独的 Node 进程中运行（自动从 PATH 查找，可用 `B1001_NODE` 指定）。
顺便也隔离了模型崩溃。

## 配置

| 键 | 含义 |
|---|---|
| `modelPath` | `.gguf` 的绝对路径，支持 `~/`；留空则只挂载不启动 |
| `contextSize` | 上下文长度，默认 8192 |
| `port` | 固定端口，默认 18111，保证写好的路由在重启后依然有效 |
| `displayName` | 模型菜单中显示的名称 |

## 许可

MIT © Bing Dai
