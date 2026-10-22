# B-1003 · Local Models Bundle

**English** | [简体中文](README.zh.md)
One install for the whole family: this package owns the rows of **B-1001** and **B-1002** and
depends on both of them.

```yaml
- insert:
    - id: b-1001-local-engine
      name: '@ml-hub476/b-1001-local-engine'
    - id: b-1002-local-models
      name: '@ml-hub476/b-1002-local-models'
```

## Use it instead of the two, not beside them

A Harness row id must be unique. If B-1001 and B-1002 are already installed as their own bundles,
remove them first, then install B-1003 — otherwise the two sets of rows collide.

## 许可

MIT © Bing Dai

See the [root README](../../README.md#install) for the step-by-step version, including how to find the path.
