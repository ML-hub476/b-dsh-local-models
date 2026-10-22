# B-1003 · 本地模型套件

一次安装整个家族：本包拥有 **B-1001** 与 **B-1002** 两行，并依赖这两个包。

```yaml
- insert:
    - id: b-1001-local-engine
      name: '@ml-hub476/b-1001-local-engine'
    - id: b-1002-local-models
      name: '@ml-hub476/b-1002-local-models'
```

## 请用它替代那两个包，而不是并存

Harness 的行 id 必须唯一。如果 B-1001、B-1002 已经各自作为 bundle 安装，请先移除它们，
再安装 B-1003，否则两组行会冲突。

## 许可

MIT © Bing Dai
