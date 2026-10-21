window.__ModuleLoader__.load({
  id: '@ml-hub476/b-1002-local-models',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useState } = React

    const PACKAGE_ID = 'B-1002'
    const SLOT_ID = 'b-1002-local-models'

    /** Built-in copy; the locale service may override it when registered. */
    const COPY = {
      en: {
        title: 'Local models',
        subtitle: 'Download an open-source model and run it on this Mac. Ollama does the storing and the running.',
        refresh: 'Refresh',
        checking: 'Checking Ollama…',
        offline: 'Ollama is not reachable',
        offlineHint: 'Install Ollama from ollama.com, open the Ollama app (or run `ollama serve`), then press Refresh.',
        systemTitle: 'This computer',
        cores: '{n} cores',
        memory: 'Memory',
        memoryValue: '{total} ({free} free)',
        disk: 'Disk',
        diskValue: '{free} free',
        fitGood: 'Fits well',
        fitTight: 'Tight fit',
        fitBig: 'Too big',
        fitNeeds: 'needs about {need} GB of {total} GB memory',
        fit: 'Memory',
        starterTitle: 'No model yet',
        starterBody: 'Start with a small model. It runs on Apple silicon in a couple of gigabytes of memory, and you can download a bigger one later.',
        starterButton: 'Download {tag} (≈{size})',
        installedTitle: 'Installed',
        menuHint: 'These appear in the model menu at the bottom of the chat box, under “Local (Ollama)”.',
        useDefault: 'Use as default',
        isDefault: 'Default model',
        remove: 'Remove',
        confirmRemove: 'Delete {tag} from this Mac? The download has to be repeated to get it back.',
        searchTitle: 'Find models on ollama.com',
        searchPlaceholder: 'Search models, for example qwen3 or gemma',
        noResults: 'No models matched that search.',
        searchFailed: 'Could not read the online list',
        download: 'Download',
        downloaded: 'Installed',
        started: 'Downloading {tag}…',
        jobTitle: 'Downloading {tag}',
        jobFailed: 'Download failed',
        jobCancelled: 'Download cancelled',
        jobDone: '{tag} is ready',
        jobSynced: 'It is now selectable in the model menu.',
        jobNotSynced: 'The file is installed, but it could not be added to the model menu',
        cancel: 'Cancel',
        dismiss: 'Dismiss',
        useAsDefaultNow: 'Make it my default model',
        defaultSaved: 'New sessions now start on {tag}.',
        busy: 'Working…',
        details: 'Details',
        close: 'Close',
        parameters: 'Parameters',
        quantization: 'Quantization',
        contextWindow: 'Context window',
        fileSize: 'Download size',
        capabilities: 'Capabilities',
        description: 'About',
        notChat: 'Not chat models',
        unknown: 'unknown',
        sizeUnknown: 'Size unknown',
        cloudOnly: 'Runs on ollama.com',
        cloudNote: 'This model runs on ollama.com, not on this computer. It needs an Ollama account sign-in, so there is no local fit verdict and nothing to download here.',
        cloud: 'Cloud',
      },
      zh: {
        title: '本地模型',
        subtitle: '在这台 Mac 上下载并运行开源模型。存储与运行由 Ollama 负责。',
        refresh: '刷新',
        checking: '正在检查 Ollama…',
        offline: '连不上 Ollama',
        offlineHint: '请先从 ollama.com 安装 Ollama，打开 Ollama 应用（或运行 `ollama serve`），然后点刷新。',
        systemTitle: '这台电脑',
        cores: '{n} 核',
        memory: '内存',
        memoryValue: '{total}（可用 {free}）',
        disk: '磁盘',
        diskValue: '可用 {free}',
        fitGood: '跑得动',
        fitTight: '勉强够用',
        fitBig: '太大了',
        fitNeeds: '需要约 {need} GB，共 {total} GB 内存',
        fit: '内存',
        starterTitle: '还没有模型',
        starterBody: '先用一个小模型起步。它在 Apple 芯片上只占几 GB 内存，之后可以再下载更大的模型。',
        starterButton: '下载 {tag}（约 {size}）',
        installedTitle: '已安装',
        menuHint: '这些模型会出现在聊天框底部的模型菜单里，分组名为“Local (Ollama)”。',
        useDefault: '设为默认',
        isDefault: '默认模型',
        remove: '删除',
        confirmRemove: '要在这台 Mac 上删除 {tag} 吗？删除后需要重新下载。',
        searchTitle: '在 ollama.com 上查找模型',
        searchPlaceholder: '搜索模型，例如 qwen3 或 gemma',
        noResults: '没有匹配的模型。',
        searchFailed: '读取在线列表失败',
        download: '下载',
        downloaded: '已安装',
        started: '正在下载 {tag}…',
        jobTitle: '正在下载 {tag}',
        jobFailed: '下载失败',
        jobCancelled: '下载已取消',
        jobDone: '{tag} 已就绪',
        jobSynced: '现在可以在模型菜单里选择了。',
        jobNotSynced: '文件已安装，但没能加入模型菜单',
        cancel: '取消',
        dismiss: '知道了',
        useAsDefaultNow: '设为我默认的模型',
        defaultSaved: '新会话将默认使用 {tag}。',
        busy: '处理中…',
        details: '详情',
        close: '收起',
        parameters: '参数量',
        quantization: '量化',
        contextWindow: '上下文',
        fileSize: '下载大小',
        capabilities: '能力',
        description: '简介',
        notChat: '非对话模型',
        unknown: '未知',
        cloud: '云端',
        sizeUnknown: '大小未知',
        cloudOnly: '在 ollama.com 上运行',
        cloudNote: '这个模型在 ollama.com 上运行，不占用本机资源，需要登录 Ollama 账号，因此没有本机适配判断，也不会有本地下载。',
      },
    }

    /** Register the dictionary and return a translate function. */
    function createTranslate(ctx) {
      const locale = typeof ctx.get === 'function' ? ctx.get('locale') : undefined
      if (locale !== undefined && locale !== null) {
        try {
          ctx.effect(() => locale.register('localModels', 'en', COPY.en), 'b-1002: en copy')
          ctx.effect(() => locale.register('localModels', 'zh', COPY.zh), 'b-1002: zh copy')
        } catch {
          // The built-in dictionary below is enough.
        }
      }
      return (key, params) => {
        let value
        try {
          if (locale !== undefined && locale !== null) {
            const translate = locale.bind('localModels')
            if (typeof translate === 'function') value = translate(key, params)
          }
        } catch {
          value = undefined
        }
        if (typeof value !== 'string' || value.length === 0) value = COPY.en[key] ?? key
        if (params !== undefined) {
          for (const [name, replacement] of Object.entries(params)) value = value.split(`{${name}}`).join(String(replacement))
        }
        return value
      }
    }

    /** One request to the plugin's Host half. */
    async function api(method, path, body) {
      const response = await fetch(`/local-models${path}`, {
        method,
        headers: {
          accept: 'application/json',
          'x-dsh-local-models': '1',
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      const text = await response.text()
      let value = {}
      try {
        value = text.length > 0 ? JSON.parse(text) : {}
      } catch {
        value = {}
      }
      if (!response.ok) throw new Error(value.error ?? `Request failed (HTTP ${response.status})`)
      return value
    }

    /** One request to the B-1001 engine surface. */
    async function engineApi(method, path, body) {
      const response = await fetch(`/local-engine${path}`, {
        method,
        headers: {
          'x-dsh-local-engine': '1',
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      const text = await response.text()
      let value = {}
      try {
        value = text.length > 0 ? JSON.parse(text) : {}
      } catch {
        value = {}
      }
      if (!response.ok) throw new Error(value.error ?? `Request failed (HTTP ${response.status})`)
      return value
    }

    const GB = 1073741824

    function formatBytes(bytes) {
      if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) return ''
      const gb = bytes / GB
      return gb >= 1 ? `${gb.toFixed(1)} GB` : `${Math.max(1, Math.round(bytes / 1048576))} MB`
    }

    function formatGB(gb) {
      if (typeof gb !== 'number' || !Number.isFinite(gb) || gb <= 0) return '?'
      return gb >= 1 ? `${gb.toFixed(1)} GB` : `${Math.round(gb * 1000)} MB`
    }

    /**
     * Match one model to this machine.
     *
     * A model needs its weights plus room for the context it keeps in memory,
     * so the estimate is 1.2x the file size plus a 1.5 GB overhead. The result
     * is deliberately conservative: a model that half-fits swaps and stalls.
     */
    function fitOf(sizeGB, totalMemoryBytes, t) {
      const totalGB = (Number(totalMemoryBytes) || 0) / GB
      if (!(sizeGB > 0) || !(totalGB > 0)) return null
      const need = sizeGB * 1.2 + 1.5
      const ratio = need / totalGB
      const level = ratio <= 0.7 ? 'good' : ratio <= 0.9 ? 'tight' : 'big'
      return {
        level,
        need,
        label: level === 'good' ? t('fitGood') : level === 'tight' ? t('fitTight') : t('fitBig'),
        sentence: t('fitNeeds', { need: Math.round(need), total: Math.round(totalGB) }),
      }
    }

    const STYLES = `
      .dlm-card { display: flex; flex-direction: column; gap: 14px; margin-top: 20px; padding: 18px 18px 16px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); }
      .dlm-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
      .dlm-code { display: inline-block; margin-right: 6px; padding: 0 5px; border-radius: 4px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent); color: var(--dsw-alias-brand-primary); font-size: 11px; font-weight: 600; line-height: 17px; vertical-align: 2px; }
      .dlm-title { font-size: 15px; font-weight: 600; line-height: 1.4; }
      .dlm-sub { margin-top: 4px; font-size: 12.5px; line-height: 1.5; color: var(--dsw-alias-label-secondary); }
      .dlm-status { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
      .dlm-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--dsw-alias-state-idle-primary); }
      .dlm-dot-ok { background: var(--dsw-alias-state-success-primary); }
      .dlm-dot-bad { background: var(--dsw-alias-state-error-primary); }
      .dlm-res { display: flex; flex-wrap: wrap; gap: 8px; }
      .dlm-res-item { display: flex; flex-direction: column; gap: 1px; padding: 7px 11px; border-radius: 8px; background: var(--dsw-alias-bg-layer-2); }
      .dlm-res-key { font-size: 10.5px; letter-spacing: 0.03em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
      .dlm-res-value { font-size: 12px; line-height: 1.35; }
      .dlm-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l1); background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 12.5px; line-height: 1.4; cursor: pointer; }
      .dlm-btn:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); }
      .dlm-btn:disabled { opacity: 0.5; cursor: default; }
      .dlm-btn-primary { border-color: transparent; background: var(--dsw-alias-brand-primary); color: #ffffff; font-weight: 600; padding: 9px 16px; font-size: 13px; }
      .dlm-btn-primary:hover:not(:disabled) { filter: brightness(1.06); background: var(--dsw-alias-brand-primary); }
      .dlm-btn-danger:hover:not(:disabled) { color: var(--dsw-alias-state-error-primary); }
      .dlm-note { padding: 10px 12px; border-radius: 9px; font-size: 12.5px; line-height: 1.55; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); }
      .dlm-note-warn { border-color: var(--dsw-alias-state-warn-primary); }
      .dlm-note-bad { border-color: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-state-error-primary); }
      .dlm-note-code { display: inline-block; margin-top: 6px; padding: 2px 6px; border-radius: 5px; background: var(--dsw-alias-bg-base); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
      .dlm-starter { display: flex; flex-direction: column; gap: 8px; padding: 14px; border: 1px dashed var(--dsw-alias-border-l2); border-radius: 10px; }
      .dlm-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 9px 0; border-top: 1px solid var(--dsw-alias-border-l1); }
      .dlm-row:first-of-type { border-top: none; }
      .dlm-row-main { min-width: 0; flex: 1; text-align: left; background: transparent; border: 0; padding: 0; font: inherit; color: inherit; cursor: pointer; }
      .dlm-row-main:hover .dlm-name { text-decoration: underline; text-underline-offset: 2px; }
      .dlm-name { font-size: 13px; font-weight: 600; line-height: 1.45; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dlm-meta { margin-top: 2px; font-size: 12px; line-height: 1.45; color: var(--dsw-alias-label-secondary); }
      .dlm-desc { margin-top: 2px; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .dlm-chips { display: inline-flex; flex-wrap: wrap; gap: 4px; margin-left: 6px; vertical-align: middle; }
      .dlm-chip { padding: 0 6px; border-radius: 5px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 17px; }
      .dlm-chip-on { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent); color: var(--dsw-alias-brand-primary); }
      .dlm-fit { padding: 0 6px; border-radius: 5px; font-size: 11px; line-height: 17px; margin-left: 6px; white-space: nowrap; }
      .dlm-fit-good { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 16%, transparent); color: var(--dsw-alias-state-success-primary); }
      .dlm-fit-tight { background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 18%, transparent); color: var(--dsw-alias-state-warn-primary); }
      .dlm-fit-big { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 14%, transparent); color: var(--dsw-alias-state-error-primary); }
      .dlm-fit-cloud { background: color-mix(in srgb, var(--dsw-alias-state-idle-primary) 22%, transparent); color: var(--dsw-alias-label-secondary); }
      .dlm-fit-unknown { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); }
      .dlm-badge { padding: 0 6px; border-radius: 5px; background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 16%, transparent); color: var(--dsw-alias-state-success-primary); font-size: 11px; line-height: 17px; margin-left: 6px; }
      .dlm-actions { display: flex; align-items: center; gap: 8px; flex: none; }
      .dlm-details { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; margin: 8px 0 2px; padding: 10px 12px; border-radius: 9px; background: var(--dsw-alias-bg-layer-2); font-size: 12px; line-height: 1.5; }
      .dlm-details-key { color: var(--dsw-alias-label-secondary); white-space: nowrap; }
      .dlm-details-text { grid-column: 1 / -1; color: var(--dsw-alias-label-secondary); }
      .dlm-bar { height: 6px; border-radius: 3px; background: var(--dsw-alias-bg-layer-2); overflow: hidden; margin-top: 8px; }
      .dlm-bar-fill { height: 100%; border-radius: 3px; background: var(--dsw-alias-brand-primary); transition: width 240ms ease; }
      .dlm-job-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 12.5px; }
      .dlm-job-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 6px; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
      .dlm-search { display: flex; align-items: center; gap: 8px; }
      .dlm-input { flex: 1; min-width: 0; padding: 7px 10px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12.5px; }
      .dlm-input:focus { outline: 2px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, transparent); outline-offset: -1px; }
      .dlm-section-title { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 12px; font-weight: 600; letter-spacing: 0.02em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
      .dlm-fold { border-top: 1px solid var(--dsw-alias-border-l1); padding-top: 10px; }
      .dlm-fold > summary { cursor: pointer; font-size: 12px; font-weight: 600; letter-spacing: 0.02em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
      .dlm-quiet { font-size: 12px; line-height: 1.55; color: var(--dsw-alias-label-secondary); }
      .dlm-scroll { max-height: 360px; overflow: auto; padding-right: 2px; }
    `

    function LocalModelsCard(props) {
      const t = props.t
      const [state, setState] = useState(null)
      const [error, setError] = useState('')
      const [notice, setNotice] = useState('')
      const [query, setQuery] = useState('')
      const [catalog, setCatalog] = useState(null)
      const [catalogBusy, setCatalogBusy] = useState(true)
      const [pending, setPending] = useState('')
      const [dismissed, setDismissed] = useState(0)
      const [open, setOpen] = useState('')
      const [engine, setEngine] = useState(null)
      const [engineModels, setEngineModels] = useState([])
      const [hubQuery, setHubQuery] = useState('')
      const [hub, setHub] = useState(null)
      const [hubBusy, setHubBusy] = useState(false)
      const [hubPick, setHubPick] = useState(null)
      const [hubJob, setHubJob] = useState(null)

      const running = state?.job?.status === 'running'
      const totalMemoryBytes = state?.system?.totalMemoryBytes ?? 0

      const refresh = useCallback(async () => {
        try {
          const next = await api('GET', '/state')
          setState(next)
          setError('')
          return next
        } catch (failure) {
          setError(failure.message)
          return null
        }
      }, [])

      useEffect(() => {
        let alive = true
        const load = async () => {
          try {
            const next = await api('GET', '/state')
            if (!alive) return
            setState(next)
            setError('')
          } catch (failure) {
            if (alive) setError(failure.message)
          }
          try {
            const response = await fetch('/local-engine/state', { headers: { 'x-dsh-local-engine': '1' } })
            if (!alive) return
            setEngine(response.ok ? await response.json() : null)
          } catch {
            if (alive) setEngine(null)
          }
          try {
            const response = await fetch('/local-engine/models', { headers: { 'x-dsh-local-engine': '1' } })
            if (alive && response.ok) setEngineModels((await response.json()).models ?? [])
            else if (alive) setEngineModels([])
          } catch {
            if (alive) setEngineModels([])
          }
          try {
            const response = await fetch('/local-engine/hub/download', { headers: { 'x-dsh-local-engine': '1' } })
            if (alive && response.ok) setHubJob((await response.json()).job ?? null)
          } catch {
            /* the engine is optional */
          }
        }
        void load()
        const timer = setInterval(() => {
          if (!document.hidden) void load()
        }, running ? 1200 : 6000)
        return () => {
          alive = false
          clearInterval(timer)
        }
      }, [running])

      const loadCatalog = useCallback(async (text, force) => {
        setCatalogBusy(true)
        try {
          const value = await api('GET', `/catalog?q=${encodeURIComponent(text)}${force === true ? '&force=1' : ''}`)
          setCatalog(value)
        } catch (failure) {
          setCatalog({ items: [], error: failure.message })
        } finally {
          setCatalogBusy(false)
        }
      }, [])

      useEffect(() => {
        let alive = true
        const timer = setTimeout(() => {
          if (alive) void loadCatalog(query, false)
        }, 350)
        return () => {
          alive = false
          clearTimeout(timer)
        }
      }, [query, loadCatalog])

      const run = async (key, action, after) => {
        setPending(key)
        setNotice('')
        setError('')
        try {
          const result = await action()
          if (after !== undefined) after(result)
          await refresh()
        } catch (failure) {
          setError(failure.message)
        } finally {
          setPending('')
        }
      }

      const download = (tag, makeDefault) =>
        run(tag, async () => {
          await api('POST', '/download', { tag, makeDefault: makeDefault === true })
          setNotice(t('started', { tag }))
        })

      const remove = (tag) => {
        if (!window.confirm(t('confirmRemove', { tag }))) return
        void run(tag, () => api('POST', '/remove', { tag }))
      }

      const useAsDefault = (tag) =>
        run(tag, () => api('POST', '/default', { tag }), () => setNotice(t('defaultSaved', { tag })))

      const toggle = (key) => setOpen((current) => (current === key ? '' : key))

      const ollama = state?.ollama
      const system = state?.system ?? null
      const installed = Array.isArray(state?.installed) ? state.installed : []
      const chatModels = installed.filter((model) => model.chat === true)
      const otherModels = installed.filter((model) => model.chat !== true)
      const job = state?.job ?? null
      const starter = state?.starter ?? { tag: 'qwen3:0.6b', approxGB: 0.4 }
      const catalogItems = Array.isArray(catalog?.items) ? catalog.items : []
      const installedNames = new Set(installed.map((model) => model.tag))
      const isDefault = (tag) => state?.default?.provider === 'local' && state.default?.model === tag
      const showJobStrip = job !== null && job.finishedAt !== null && job.finishedAt > dismissed && job.status !== 'running'

      /**
       * A verdict for every row. A cloud model has no local size at all, and a
       * local model the search page did not size still needs a visible state —
       * silence there looked like a bug.
       */
      const fitBadge = (sizeGB, cloud) => {
        if (cloud === true) return h('span', { className: 'dlm-fit dlm-fit-cloud' }, t('cloud'))
        const fit = fitOf(sizeGB, totalMemoryBytes, t)
        if (fit === null) return h('span', { className: 'dlm-fit dlm-fit-unknown' }, t('sizeUnknown'))
        return h('span', { className: `dlm-fit dlm-fit-${fit.level}` }, fit.label)
      }

      const detailsPanel = (rows, description) =>
        h(
          'div',
          { className: 'dlm-details' },
          rows
            .filter((row) => row !== null && row !== undefined && row.value !== '')
            .map((row) =>
              h(React.Fragment, { key: row.key }, h('span', { className: 'dlm-details-key' }, row.key), h('span', null, row.value)),
            ),
          typeof description === 'string' && description.length > 0 ? h('div', { className: 'dlm-details-text' }, description) : null,
        )

      const searchHub = useCallback(async (text) => {
        setHubBusy(true)
        try {
          const value = await engineApi('GET', `/hub/search?q=${encodeURIComponent(text)}`)
          setHub(value)
        } catch (failure) {
          setHub({ items: [], error: String(failure?.message ?? failure) })
        } finally {
          setHubBusy(false)
        }
      }, [])

      useEffect(() => {
        let alive = true
        const timer = setTimeout(() => {
          if (alive) void searchHub(hubQuery)
        }, 400)
        return () => {
          alive = false
          clearTimeout(timer)
        }
      }, [hubQuery, searchHub])

      const chooseRepo = async (repo) => {
        setHubBusy(true)
        setHubPick(null)
        try {
          setHubPick(await engineApi('GET', `/hub/files?repo=${encodeURIComponent(repo)}`))
        } catch (failure) {
          setError(String(failure?.message ?? failure))
        } finally {
          setHubBusy(false)
        }
      }

      const downloadGGUF = async (repo, file) => {
        setError('')
        try {
          const value = await engineApi('POST', '/hub/download', { repo, file })
          setHubJob(value.job ?? null)
        } catch (failure) {
          setError(String(failure?.message ?? failure))
        }
      }

      const useEngineModel = async (name) => {
        setPending(name)
        setError('')
        try {
          await engineApi('POST', '/use', { file: name })
        } catch (failure) {
          setError(String(failure?.message ?? failure))
        } finally {
          setPending('')
        }
        await refresh()
      }

      const removeEngineModel = async (name) => {
        if (!window.confirm(`Delete ${name} from this Mac?`)) return
        setPending(name)
        try {
          await engineApi('DELETE', '/models', { file: name })
        } catch (failure) {
          setError(String(failure?.message ?? failure))
        } finally {
          setPending('')
        }
        await refresh()
      }

      /** B-1001 has no window of its own, so the card is where it is visible. */
      const engineAction = async (action) => {
        try {
          await fetch(`/local-engine/${action}`, { method: 'POST', headers: { 'x-dsh-local-engine': '1' } })
        } catch (failure) {
          setError(String(failure?.message ?? failure))
        }
        await refresh()
      }

      const enginePanel = () => {
        if (engine === null) return null
        const isRunning = engine.status === 'running'
        return h(
          'div',
          { className: 'dlm-note' + (isRunning ? '' : ' dlm-note-warn') },
          h(
            'div',
            { className: 'dlm-job-head' },
            h('span', null, h('span', { className: 'dlm-code' }, 'B-1001'), 'Your own engine'),
            h(
              'span',
              { className: 'dlm-status' },
              h('span', { className: isRunning ? 'dlm-dot dlm-dot-ok' : 'dlm-dot dlm-dot-bad' }),
              isRunning ? 'Running' : engine.status,
            ),
          ),
          h(
            'div',
            { className: 'dlm-quiet', style: { marginTop: '4px' } },
            isRunning
              ? `Running ${engine.model} on port ${engine.port}. This model needs no Ollama. It is listed in the model menu as “Local (built-in)”.`
              : engine.error || 'The engine is not running.',
          ),
          h(
            'div',
            { style: { display: 'flex', gap: '8px', marginTop: '8px' } },
            h(
              'button',
              { type: 'button', className: 'dlm-btn', onClick: () => void engineAction(isRunning ? 'stop' : 'start') },
              isRunning ? 'Stop engine' : 'Start engine',
            ),
            isRunning
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'dlm-btn dlm-btn-primary',
                    disabled: pending !== '',
                    onClick: () =>
                      void run(engine.model, () => api('POST', '/default', { tag: engine.model, provider: 'local-builtin' }), () =>
                        setNotice(`New sessions now start on ${engine.model} (your own engine).`),
                      ),
                  },
                  'Make this my default model',
                )
              : null,
          ),
        )
      }

      const engineHubBlock = () => {
        if (engine === null) return null
        const items = Array.isArray(hub?.items) ? hub.items : []
        const jobRunning = hubJob?.status === 'running'
        return h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
          h('div', { className: 'dlm-section-title' }, h('span', null, "Your engine's models")),
          engineModels.length === 0
            ? h('div', { className: 'dlm-quiet' }, 'No model downloaded yet. Pick one from Hugging Face below.')
            : engineModels.map((model) =>
                h(
                  'div',
                  { className: 'dlm-row', key: model.name },
                  h(
                    'div',
                    { className: 'dlm-row-main', style: { cursor: 'default' } },
                    h(
                      'div',
                      { className: 'dlm-name' },
                      model.name,
                      model.active ? h('span', { className: 'dlm-badge' }, 'Loaded') : null,
                    ),
                    h('div', { className: 'dlm-meta' }, formatBytes(model.size)),
                  ),
                  h(
                    'div',
                    { className: 'dlm-actions' },
                    model.active
                      ? null
                      : h(
                          'button',
                          { type: 'button', className: 'dlm-btn', disabled: pending !== '', onClick: () => void useEngineModel(model.name) },
                          'Use',
                        ),
                    h(
                      'button',
                      { type: 'button', className: 'dlm-btn dlm-btn-danger', disabled: pending !== '', onClick: () => void removeEngineModel(model.name) },
                      'Remove',
                    ),
                  ),
                ),
              ),
          jobRunning
            ? h(
                'div',
                { className: 'dlm-note' },
                h('div', { className: 'dlm-job-head' }, h('span', null, `Downloading ${hubJob.file}`), h('span', null, `${hubJob.percent}%`)),
                h('div', { className: 'dlm-bar' }, h('div', { className: 'dlm-bar-fill', style: { width: `${hubJob.percent}%` } })),
                h(
                  'div',
                  { className: 'dlm-job-foot' },
                  h('span', null, hubJob.total > 0 ? `${formatBytes(hubJob.received)} / ${formatBytes(hubJob.total)}` : formatBytes(hubJob.received)),
                  h('span', null, 'Saved to your engine folder'),
                ),
              )
            : null,
          hubJob?.status === 'done'
            ? h('div', { className: 'dlm-note' }, `${hubJob.name} downloaded. Press “Use” to load it.`)
            : null,
          hubJob?.status === 'error'
            ? h('div', { className: 'dlm-note dlm-note-bad' }, `Download failed: ${hubJob.error}`)
            : null,
          h('div', { className: 'dlm-section-title', style: { marginTop: '6px' } }, h('span', null, 'Find models on Hugging Face')),
          h(
            'div',
            { className: 'dlm-search' },
            h('input', {
              className: 'dlm-input',
              type: 'search',
              value: hubQuery,
              placeholder: 'Search GGUF models, for example qwen3 or gemma',
              onChange: (event) => setHubQuery(event.target.value),
              'aria-label': 'Search Hugging Face',
            }),
          ),
          hub?.error !== undefined ? h('div', { className: 'dlm-note dlm-note-warn' }, `Hugging Face search failed: ${hub.error}`) : null,
          h(
            'div',
            { className: 'dlm-scroll', style: { marginTop: '2px' } },
            items.length === 0 && !hubBusy && hub?.error === undefined
              ? h('div', { className: 'dlm-quiet', style: { padding: '8px 0' } }, 'No GGUF repository matched that search.')
              : null,
            items.slice(0, 20).map((item) =>
              h(
                'div',
                { className: 'dlm-row', key: item.repo },
                h(
                  'div',
                  { className: 'dlm-row-main', style: { cursor: 'default' } },
                  h('div', { className: 'dlm-name' }, item.repo),
                  h(
                    'div',
                    { className: 'dlm-meta' },
                    [item.gated ? 'needs a Hugging Face login' : '', `${item.downloads.toLocaleString()} downloads`]
                      .filter((part) => part.length > 0)
                      .join(' · '),
                  ),
                ),
                h(
                  'div',
                  { className: 'dlm-actions' },
                  h(
                    'button',
                    { type: 'button', className: 'dlm-btn', disabled: hubBusy || item.gated, onClick: () => void chooseRepo(item.repo) },
                    item.gated ? 'Gated' : 'Choose',
                  ),
                ),
              ),
            ),
          ),
          hubPick !== null
            ? h(
                'div',
                { className: 'dlm-note' },
                h('div', null, hubPick.repo),
                h(
                  'div',
                  { className: 'dlm-quiet', style: { marginTop: '4px' } },
                  `${hubPick.files.length} model file(s) · license ${hubPick.license} · smallest download first`,
                ),
                h(
                  'div',
                  { style: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' } },
                  hubPick.files.slice(0, 4).map((file) =>
                    h(
                      'button',
                      { type: 'button', className: 'dlm-btn', key: file, disabled: jobRunning, onClick: () => void downloadGGUF(hubPick.repo, file) },
                      file,
                    ),
                  ),
                ),
              )
            : null,
        )
      }

      const systemStrip = () => {
        if (system === null) return null
        const cpu = String(system.cpu ?? '').replace(/\s+/g, ' ').trim()
        const cpuShort = cpu.length > 26 ? `${cpu.slice(0, 26)}…` : cpu
        const memoryFree = typeof system.freeMemoryBytes === 'number' ? formatBytes(system.freeMemoryBytes) : t('unknown')
        const diskFree = system.disk === null || system.disk === undefined ? '' : formatBytes(system.disk.freeBytes)
        const item = (key, value) =>
          h('div', { className: 'dlm-res-item', key }, h('span', { className: 'dlm-res-key' }, key), h('span', { className: 'dlm-res-value' }, value))
        return h(
          'div',
          { className: 'dlm-res' },
          item(
            t('systemTitle'),
            [cpuShort.length > 0 ? cpuShort : `${system.platform}/${system.arch}`, t('cores', { n: system.cores })].filter((part) => part.length > 0).join(' · '),
          ),
          item(t('memory'), t('memoryValue', { total: formatBytes(system.totalMemoryBytes), free: memoryFree })),
          diskFree.length > 0 ? item(t('disk'), t('diskValue', { free: diskFree })) : null,
        )
      }

      const jobStrip = () => {
        if (!showJobStrip) return null
        if (job.status === 'error') return h('div', { className: 'dlm-note dlm-note-bad' }, `${t('jobFailed')}: ${job.message}`)
        if (job.status === 'cancelled') return h('div', { className: 'dlm-note' }, `${t('jobCancelled')}: ${job.tag}`)
        const synced = job.sync?.ok === true
        const defaultOk = job.defaultResult?.ok === true
        return h(
          'div',
          { className: 'dlm-note' + (synced ? '' : ' dlm-note-warn') },
          h('div', null, t('jobDone', { tag: job.tag })),
          h('div', { className: 'dlm-quiet', style: { marginTop: '4px' } }, synced ? t('jobSynced') : `${t('jobNotSynced')}: ${job.sync?.error ?? job.sync?.reason ?? ''}`),
          defaultOk ? h('div', { className: 'dlm-quiet', style: { marginTop: '4px' } }, t('defaultSaved', { tag: job.tag })) : null,
          h(
            'div',
            { style: { display: 'flex', gap: '8px', marginTop: '8px' } },
            !defaultOk && synced
              ? h('button', { type: 'button', className: 'dlm-btn', onClick: () => void useAsDefault(job.tag), disabled: pending === job.tag }, t('useAsDefaultNow'))
              : null,
            h('button', { type: 'button', className: 'dlm-btn', onClick: () => setDismissed(job.finishedAt) }, t('dismiss')),
          ),
        )
      }

      const jobPanel = () => {
        if (!running) return null
        const progress = Math.max(0, Math.min(100, Number(job.percent) || 0))
        return h(
          'div',
          { className: 'dlm-note' },
          h('div', { className: 'dlm-job-head' }, h('span', null, t('jobTitle', { tag: job.tag })), h('span', null, `${progress}%`)),
          h('div', { className: 'dlm-bar' }, h('div', { className: 'dlm-bar-fill', style: { width: `${progress}%` } })),
          h(
            'div',
            { className: 'dlm-job-foot' },
            h('span', null, `${job.phase ?? ''}${job.total > 0 ? ` · ${formatBytes(job.completed)} / ${formatBytes(job.total)}` : ''}`),
            h('button', { type: 'button', className: 'dlm-btn', onClick: () => void run(job.tag, () => api('POST', '/cancel')) }, t('cancel')),
          ),
        )
      }

      const starterBlock = () => {
        if (chatModels.length > 0) return null
        const size = formatGB(starter.approxGB)
        return h(
          'div',
          { className: 'dlm-starter' },
          h('div', { className: 'dlm-name' }, t('starterTitle')),
          h('div', { className: 'dlm-quiet' }, t('starterBody')),
          h(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '2px' } },
            h(
              'button',
              {
                type: 'button',
                className: 'dlm-btn dlm-btn-primary',
                disabled: pending !== '' || running,
                onClick: () => void download(starter.tag, true),
              },
              t('starterButton', { tag: starter.tag, size }),
            ),
            fitBadge(starter.approxGB),
          ),
        )
      }

      const installedBlock = () => {
        if (chatModels.length === 0 && otherModels.length === 0) return null
        return h(
          'div',
          null,
          h(
            'div',
            { className: 'dlm-section-title' },
            h('span', null, `${t('installedTitle')} (${installed.length})`),
            h('button', { type: 'button', className: 'dlm-btn', onClick: () => void refresh() }, t('refresh')),
          ),
          chatModels.map((model) => {
            const key = `installed:${model.tag}`
            const sizeGB = typeof model.size === 'number' ? model.size / GB : 0
            return h(
              'div',
              { key },
              h(
                'div',
                { className: 'dlm-row' },
                h(
                  'button',
                  { type: 'button', className: 'dlm-row-main', onClick: () => toggle(key), 'aria-expanded': open === key },
                  h(
                    'div',
                    { className: 'dlm-name' },
                    model.tag,
                    isDefault(model.tag) ? h('span', { className: 'dlm-badge' }, t('isDefault')) : null,
                    fitBadge(sizeGB),
                  ),
                  h(
                    'div',
                    { className: 'dlm-meta' },
                    [model.parameters, model.quantization, formatBytes(model.size)].filter((part) => typeof part === 'string' && part.length > 0).join(' · '),
                  ),
                ),
                h(
                  'div',
                  { className: 'dlm-actions' },
                  isDefault(model.tag)
                    ? null
                    : h('button', { type: 'button', className: 'dlm-btn', disabled: pending !== '' || running, onClick: () => void useAsDefault(model.tag) }, t('useDefault')),
                  h('button', { type: 'button', className: 'dlm-btn dlm-btn-danger', disabled: pending !== '' || running, onClick: () => remove(model.tag) }, t('remove')),
                ),
              ),
              open === key
                ? detailsPanel(
                    [
                      { key: t('parameters'), value: model.parameters || t('unknown') },
                      { key: t('quantization'), value: model.quantization || t('unknown') },
                      { key: t('fileSize'), value: formatBytes(model.size) || t('unknown') },
                      { key: t('contextWindow'), value: model.contextWindow > 0 ? model.contextWindow.toLocaleString() : t('unknown') },
                      model.capabilities.length > 0 ? { key: t('capabilities'), value: model.capabilities.join(' · ') } : null,
                      fitOf(sizeGB, totalMemoryBytes, t) !== null ? { key: t('fit'), value: fitOf(sizeGB, totalMemoryBytes, t).sentence } : null,
                    ],
                    '',
                  )
                : null,
            )
          }),
          otherModels.length > 0
            ? h(
                'div',
                { className: 'dlm-quiet', style: { marginTop: '8px' } },
                `${t('notChat')}: ${otherModels.map((model) => model.tag).join(', ')}`,
              )
            : null,
          chatModels.length > 0 ? h('div', { className: 'dlm-quiet', style: { marginTop: '8px' } }, t('menuHint')) : null,
        )
      }

      const catalogBlock = () => {
        const chip = (text, on) => h('span', { className: on ? 'dlm-chip dlm-chip-on' : 'dlm-chip', key: text }, text)
        return h(
          'div',
          null,
          h('div', { className: 'dlm-section-title' }, h('span', null, t('searchTitle'))),
          h(
            'div',
            { className: 'dlm-search', style: { marginTop: '8px' } },
            h('input', {
              className: 'dlm-input',
              type: 'search',
              value: query,
              placeholder: t('searchPlaceholder'),
              onChange: (event) => setQuery(event.target.value),
              'aria-label': t('searchTitle'),
            }),
            h('button', { type: 'button', className: 'dlm-btn', disabled: catalogBusy, onClick: () => void loadCatalog(query, true) }, catalogBusy ? t('busy') : t('refresh')),
          ),
          catalog?.error !== undefined
            ? h('div', { className: 'dlm-note dlm-note-warn', style: { marginTop: '10px' } }, `${t('searchFailed')}: ${catalog.error}`)
            : null,
          h(
            'div',
            { className: 'dlm-scroll', style: { marginTop: '6px' } },
            catalogItems.length === 0 && !catalogBusy && catalog?.error === undefined
              ? h('div', { className: 'dlm-quiet', style: { padding: '10px 0' } }, t('noResults'))
              : null,
            catalogItems.map((item) => {
              const key = `catalog:${item.name}`
              const installedAlready = installedNames.has(item.name) || [...installedNames].some((tag) => tag.startsWith(`${item.name}:`))
              return h(
                'div',
                { key },
                h(
                  'div',
                  { className: 'dlm-row' },
                  h(
                    'button',
                    { type: 'button', className: 'dlm-row-main', onClick: () => toggle(key), 'aria-expanded': open === key },
                    h(
                      'div',
                      { className: 'dlm-name' },
                      item.name,
                      item.capabilities.length > 0
                        ? h('span', { className: 'dlm-chips' }, item.capabilities.slice(0, 3).map((value) => chip(value, value === 'tools')))
                        : null,
                      fitBadge(item.approxGB, item.cloudOnly === true),
                    ),
                    h(
                      'div',
                      { className: 'dlm-desc' },
                      [item.sizes.length > 0 ? `${item.sizes.slice(0, 4).join(' / ')} · ≈${formatGB(item.approxGB)}` : '', item.description]
                        .filter((part) => typeof part === 'string' && part.length > 0)
                        .join(' · '),
                    ),
                  ),
                  h(
                    'div',
                    { className: 'dlm-actions' },
                    item.cloudOnly === true
                      ? h('span', { className: 'dlm-quiet' }, t('cloudOnly'))
                      : installedAlready
                      ? h('span', { className: 'dlm-quiet' }, t('downloaded'))
                      : h(
                          'button',
                          {
                            type: 'button',
                            className: 'dlm-btn',
                            disabled: pending !== '' || running,
                            onClick: () => void download(item.name, false),
                          },
                          t('download'),
                        ),
                  ),
                ),
                open === key
                  ? detailsPanel(
                      [
                        { key: t('fileSize'), value: item.approxGB > 0 ? `≈${formatGB(item.approxGB)}` : t('unknown') },
                        item.sizes.length > 0 ? { key: t('parameters'), value: item.sizes.join(' / ') } : null,
                        item.capabilities.length > 0 ? { key: t('capabilities'), value: item.capabilities.join(' · ') } : null,
                        fitOf(item.approxGB, totalMemoryBytes, t) !== null ? { key: t('fit'), value: fitOf(item.approxGB, totalMemoryBytes, t).sentence } : null,
                      ],
                      item.cloudOnly === true ? t('cloudNote') : item.description,
                    )
                  : null,
              )
            }),
          ),
        )
      }

      const offline = state !== null && ollama?.running !== true
      return h(
        'section',
        { className: 'dlm-card', 'aria-label': t('title') },
        h('style', null, STYLES),
        h(
          'div',
          { className: 'dlm-head' },
          h(
            'div',
            null,
            h('div', { className: 'dlm-title' }, h('span', { className: 'dlm-code' }, PACKAGE_ID), t('title')),
            h('div', { className: 'dlm-sub' }, t('subtitle')),
          ),
          h(
            'div',
            { className: 'dlm-status' },
            h('span', { className: ollama?.running === true ? 'dlm-dot dlm-dot-ok' : offline ? 'dlm-dot dlm-dot-bad' : 'dlm-dot' }),
            ollama?.running === true ? `Ollama ${ollama.version}` : state === null ? t('checking') : t('offline'),
          ),
        ),
        error.length > 0 ? h('div', { className: 'dlm-note dlm-note-bad' }, error) : null,
        notice.length > 0 ? h('div', { className: 'dlm-note' }, notice) : null,
        enginePanel(),
        systemStrip(),
        offline
          ? h(
              'div',
              { className: 'dlm-note dlm-note-warn' },
              h('div', null, t('offlineHint')),
              h('div', null, h('span', { className: 'dlm-note-code' }, 'ollama serve')),
            )
          : null,
        engineHubBlock(),
        h(
          'details',
          { className: 'dlm-fold' },
          h('summary', null, engine === null ? 'Ollama models' : 'Ollama (optional — your own engine does not need it)'),
          h(
            'div',
            { style: { display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' } },
            jobPanel(),
            jobStrip(),
            offline ? null : starterBlock(),
            offline ? null : installedBlock(),
            offline ? null : catalogBlock(),
          ),
        ),
      )
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        const t = createTranslate(ctx)
        ctx.slots.inject('settings.models.footer', () =>
          ctx.slots.register({ name: 'settings.models.footer', id: SLOT_ID, order: 20, label: () => `${PACKAGE_ID} ${t('title')}` }, (props) =>
            h(LocalModelsCard, { ...props, t }),
          ),
        )
      },
    }
  },
})
