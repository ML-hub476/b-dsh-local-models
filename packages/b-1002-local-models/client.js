window.__ModuleLoader__.load({
  id: '@ml-hub476/b-1002-local-models',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useState } = React

    const PACKAGE_ID = 'B-1002'
    const SLOT_ID = 'b-1002-local-models'
    const GB = 1073741824

    const COPY = {
      en: {
        title: 'Local models',
        subtitle: 'Your own engine: find a model on Hugging Face, download it, and run it here. No Ollama needed.',
        systemTitle: 'This computer',
        cores: '{n} cores',
        memory: 'Memory',
        disk: 'Disk',
        memoryValue: '{total} ({free} free)',
        diskValue: '{free} free',
        engineTitle: 'Your own engine',
        running: 'Running',
        stopped: 'Stopped',
        start: 'Start engine',
        stop: 'Stop engine',
        startFailed: 'Could not start the engine',
        makeDefault: 'Make this my default model',
        defaultDone: 'New sessions now start on {model}.',
        shelf: "Your engine's models",
        shelfEmpty: 'No model yet. Download one from Hugging Face below.',
        loaded: 'Loaded',
        use: 'Use',
        remove: 'Remove',
        confirmRemove: 'Delete {name} from this Mac? The download has to be repeated.',
        searchTitle: 'Find models on Hugging Face',
        searchPlaceholder: 'Search GGUF models, for example qwen3 or gemma',
        choose: 'Choose',
        gated: 'Needs a login',
        noResults: 'No GGUF repository matched that search.',
        searchFailed: 'Hugging Face search failed',
        filesTitle: '{repo} · {n} file(s) · license {license}',
        download: 'Download',
        downloading: 'Downloading {file}',
        downloadDone: '{name} downloaded. Press “Use” to load it.',
        downloadFailed: 'Download failed',
        fitGood: 'Fits well',
        fitTight: 'Tight fit',
        fitBig: 'Too big',
        fitNeeds: 'needs about {need} GB of {total} GB memory',
        fit: 'Memory',
        sizeUnknown: 'Size unknown',
        working: 'Working…',
        fileSize: 'File size',
        context: 'Context',
        details: 'Details',
      },
      zh: {
        title: '本地模型',
        subtitle: '你自己的引擎：在 Hugging Face 上找模型、下载到本机并运行。不需要 Ollama。',
        systemTitle: '这台电脑',
        cores: '{n} 核',
        memory: '内存',
        disk: '磁盘',
        memoryValue: '{total}（可用 {free}）',
        diskValue: '可用 {free}',
        engineTitle: '你自己的引擎',
        running: '运行中',
        stopped: '未运行',
        start: '启动引擎',
        stop: '停止引擎',
        startFailed: '引擎启动失败',
        makeDefault: '设为我默认的模型',
        defaultDone: '新会话将默认使用 {model}。',
        shelf: '引擎里的模型',
        shelfEmpty: '还没有模型。请在下面从 Hugging Face 下载一个。',
        loaded: '已加载',
        use: '使用',
        remove: '删除',
        confirmRemove: '要在这台 Mac 上删除 {name} 吗？删除后需要重新下载。',
        searchTitle: '在 Hugging Face 上查找模型',
        searchPlaceholder: '搜索 GGUF 模型，例如 qwen3 或 gemma',
        choose: '选择',
        gated: '需要登录',
        noResults: '没有匹配的 GGUF 仓库。',
        searchFailed: 'Hugging Face 搜索失败',
        filesTitle: '{repo} · {n} 个文件 · 许可 {license}',
        download: '下载',
        downloading: '正在下载 {file}',
        downloadDone: '{name} 已下载。点“使用”即可加载。',
        downloadFailed: '下载失败',
        fitGood: '跑得动',
        fitTight: '勉强够用',
        fitBig: '太大了',
        fitNeeds: '需要约 {need} GB，共 {total} GB 内存',
        fit: '内存',
        sizeUnknown: '大小未知',
        working: '处理中…',
        fileSize: '文件大小',
        context: '上下文',
        details: '详情',
      },
    }

    function createTranslate(ctx) {
      const locale = typeof ctx.get === 'function' ? ctx.get('locale') : undefined
      if (locale) {
        try {
          ctx.effect(() => locale.register('localModels', 'en', COPY.en), 'b-1002: en copy')
          ctx.effect(() => locale.register('localModels', 'zh', COPY.zh), 'b-1002: zh copy')
        } catch {
          /* the built-in copy is enough */
        }
      }
      return (key, params) => {
        let value
        try {
          if (locale) {
            const translate = locale.bind('localModels')
            if (typeof translate === 'function') value = translate(key, params)
          }
        } catch {
          value = undefined
        }
        if (typeof value !== 'string' || value.length === 0) value = COPY.en[key] ?? key
        if (params) for (const [name, replacement] of Object.entries(params)) value = value.split(`{${name}}`).join(String(replacement))
        return value
      }
    }

    /** Every call in this card goes to the B-1001 engine. */
    async function engineApi(method, path, body) {
      const response = await fetch(`/local-engine${path}`, {
        method,
        headers: {
          accept: 'application/json',
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

    function formatBytes(bytes) {
      if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) return ''
      const gb = bytes / GB
      return gb >= 1 ? `${gb.toFixed(1)} GB` : `${Math.max(1, Math.round(bytes / 1048576))} MB`
    }

    /** Match one model file to this machine: weights + context + overhead. */
    function fitOf(sizeBytes, totalMemoryBytes, t) {
      const sizeGB = (Number(sizeBytes) || 0) / GB
      const totalGB = (Number(totalMemoryBytes) || 0) / GB
      if (!(sizeGB > 0) || !(totalGB > 0)) return null
      const need = sizeGB * 1.2 + 1.5
      const ratio = need / totalGB
      const level = ratio <= 0.7 ? 'good' : ratio <= 0.9 ? 'tight' : 'big'
      return {
        level,
        label: level === 'good' ? t('fitGood') : level === 'tight' ? t('fitTight') : t('fitBig'),
        sentence: t('fitNeeds', { need: Math.round(need), total: Math.round(totalGB) }),
      }
    }

    /** LM Studio says "65 days ago"; so do we. */
    function agoOf(iso) {
      const at = Date.parse(String(iso ?? ''))
      if (!Number.isFinite(at)) return 'unknown'
      const days = Math.floor((Date.now() - at) / 86400000)
      if (days <= 0) return 'today'
      if (days === 1) return 'yesterday'
      if (days < 30) return `${days} days ago`
      const months = Math.round(days / 30)
      return months <= 1 ? 'last month' : `${months} months ago`
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
      .dlm-btn-primary { border-color: transparent; background: var(--dsw-alias-brand-primary); color: #ffffff; font-weight: 600; padding: 8px 14px; font-size: 12.5px; }
      .dlm-btn-primary:hover:not(:disabled) { filter: brightness(1.06); background: var(--dsw-alias-brand-primary); }
      .dlm-btn-danger:hover:not(:disabled) { color: var(--dsw-alias-state-error-primary); }
      .dlm-note { padding: 10px 12px; border-radius: 9px; font-size: 12.5px; line-height: 1.55; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); }
      .dlm-note-warn { border-color: var(--dsw-alias-state-warn-primary); }
      .dlm-note-bad { border-color: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-state-error-primary); }
      .dlm-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 9px 0; border-top: 1px solid var(--dsw-alias-border-l1); }
      .dlm-row:first-of-type { border-top: none; }
      .dlm-row-main { min-width: 0; flex: 1; }
      .dlm-name { font-size: 13px; font-weight: 600; line-height: 1.45; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dlm-meta { margin-top: 2px; font-size: 12px; line-height: 1.45; color: var(--dsw-alias-label-secondary); }
      .dlm-fit { padding: 0 6px; border-radius: 5px; font-size: 11px; line-height: 17px; margin-left: 6px; white-space: nowrap; }
      .dlm-fit-good { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 16%, transparent); color: var(--dsw-alias-state-success-primary); }
      .dlm-fit-tight { background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 18%, transparent); color: var(--dsw-alias-state-warn-primary); }
      .dlm-fit-big { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 14%, transparent); color: var(--dsw-alias-state-error-primary); }
      .dlm-badge { padding: 0 6px; border-radius: 5px; background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 16%, transparent); color: var(--dsw-alias-state-success-primary); font-size: 11px; line-height: 17px; margin-left: 6px; }
      .dlm-actions { display: flex; align-items: center; gap: 8px; flex: none; }
      .dlm-bar { height: 6px; border-radius: 3px; background: var(--dsw-alias-bg-layer-2); overflow: hidden; margin-top: 8px; }
      .dlm-bar-fill { height: 100%; border-radius: 3px; background: var(--dsw-alias-brand-primary); transition: width 240ms ease; }
      .dlm-job-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 12.5px; }
      .dlm-job-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 6px; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
      .dlm-input { flex: 1; min-width: 0; padding: 7px 10px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12.5px; }
      .dlm-input:focus { outline: 2px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, transparent); outline-offset: -1px; }
      .dlm-section-title { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 12px; font-weight: 600; letter-spacing: 0.02em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
      .dlm-quiet { font-size: 12px; line-height: 1.55; color: var(--dsw-alias-label-secondary); }
      .dlm-detail { display: flex; flex-direction: column; gap: 10px; padding: 14px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-2); }
      .dlm-detail-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .dlm-detail-title { font-size: 16px; font-weight: 650; line-height: 1.35; word-break: break-word; }
      .dlm-detail-caps { display: flex; flex-wrap: wrap; gap: 6px; }
      .dlm-cap { padding: 1px 8px; border-radius: 6px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); color: var(--dsw-alias-brand-primary); font-size: 11.5px; line-height: 19px; }
      .dlm-specs { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 8px; }
      .dlm-spec { padding: 8px 10px; border-radius: 8px; background: var(--dsw-alias-bg-base); }
      .dlm-spec-key { font-size: 10.5px; letter-spacing: 0.03em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
      .dlm-spec-value { font-size: 12.5px; line-height: 1.4; }
      .dlm-readme { padding: 10px 12px; border-radius: 9px; background: var(--dsw-alias-bg-base); }
      .dlm-readme-text { font-size: 12px; line-height: 1.6; color: var(--dsw-alias-label-secondary); white-space: pre-wrap; max-height: 260px; overflow: auto; }
      .dlm-select { padding: 4px 8px; border-radius: 7px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font: inherit; font-size: 11.5px; text-transform: none; letter-spacing: 0; }
      .dlm-chips { display: inline-flex; flex-wrap: wrap; gap: 4px; margin-left: 6px; vertical-align: middle; }
      .dlm-chip { padding: 0 6px; border-radius: 5px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 17px; }
      .dlm-row-btn { background: transparent; border: 0; padding: 0; font: inherit; color: inherit; text-align: left; cursor: pointer; }
      .dlm-row-btn:hover .dlm-name { text-decoration: underline; text-underline-offset: 2px; }
      .dlm-details { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; margin: 0 0 8px; padding: 10px 12px; border-radius: 9px; background: var(--dsw-alias-bg-layer-2); font-size: 12px; line-height: 1.5; }
      .dlm-details-key { color: var(--dsw-alias-label-secondary); white-space: nowrap; }
      .dlm-file-row { grid-column: 1 / -1; display: flex; align-items: center; gap: 8px; padding-top: 6px; border-top: 1px solid var(--dsw-alias-border-l1); }
      .dlm-file-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11.5px; }
      .dlm-file-size { color: var(--dsw-alias-label-secondary); font-size: 11.5px; }
      .dlm-scroll { max-height: 340px; overflow: auto; padding-right: 2px; }
    `

    function LocalModelsCard(props) {
      const t = props.t
      const [engine, setEngine] = useState(null)
      const [models, setModels] = useState([])
      const [system, setSystem] = useState(null)
      const [hub, setHub] = useState(null)
      const [hubQuery, setHubQuery] = useState('')
      const [hubBusy, setHubBusy] = useState(true)
      const [hubPick, setHubPick] = useState(null)
      const [details, setDetails] = useState(null)
      const [sortBy, setSortBy] = useState('fit')
      const [job, setJob] = useState(null)
      const [pending, setPending] = useState('')
      const [error, setError] = useState('')
      const [notice, setNotice] = useState('')

      const running = engine?.status === 'running'
      const downloading = job?.status === 'running'

      const poll = useCallback(async () => {
        try {
          const [engineState, shelf, facts, download] = await Promise.all([
            engineApi('GET', '/state').catch(() => null),
            engineApi('GET', '/models').catch(() => ({ models: [] })),
            engineApi('GET', '/system').catch(() => null),
            engineApi('GET', '/hub/download').catch(() => ({ job: null })),
          ])
          setEngine(engineState)
          setModels(Array.isArray(shelf?.models) ? shelf.models : [])
          if (facts !== null) setSystem(facts)
          setJob(download?.job ?? null)
        } catch (failure) {
          setError(String(failure?.message ?? failure))
        }
      }, [])

      useEffect(() => {
        let alive = true
        const tick = () => {
          if (!alive || document.hidden) return
          void poll()
        }
        tick()
        const timer = setInterval(tick, downloading ? 1200 : 4000)
        return () => {
          alive = false
          clearInterval(timer)
        }
      }, [poll, downloading])

      const searchHub = useCallback(async (text) => {
        setHubBusy(true)
        try {
          setHub(await engineApi('GET', `/hub/search?q=${encodeURIComponent(text)}`))
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

      const guard = async (label, task) => {
        setPending(label)
        setError('')
        try {
          return await task()
        } catch (failure) {
          setError(String(failure?.message ?? failure))
          return null
        } finally {
          setPending('')
          await poll()
        }
      }

      const startStop = () =>
        guard('engine', () => engineApi('POST', running ? '/stop' : '/start'))

      const makeDefault = () =>
        guard('default', async () => {
          await engineApi('POST', '/default', {})
          setNotice(t('defaultDone', { model: engine?.model ?? '' }))
        })

      const chooseRepo = (repo) =>
        guard('pick', async () => {
          setHubPick(null)
          setHubPick(await engineApi('GET', `/hub/files?repo=${encodeURIComponent(repo)}`))
        })

      const downloadFile = (repo, file) =>
        guard('download', async () => {
          const value = await engineApi('POST', '/hub/download', { repo, file })
          setJob(value.job ?? null)
        })

      const useModel = (file) => guard(file, () => engineApi('POST', '/use', { file }))

      const removeModel = (file) => {
        if (!window.confirm(t('confirmRemove', { name: file }))) return
        void guard(file, () => engineApi('DELETE', '/models', { file }))
      }

      const fitBadge = (bytes) => {
        const fit = fitOf(bytes, system?.totalMemoryBytes, t)
        if (fit === null) return h('span', { className: 'dlm-fit dlm-fit-tight' }, t('sizeUnknown'))
        return h('span', { className: `dlm-fit dlm-fit-${fit.level}` }, fit.label)
      }

      const systemStrip = () => {
        if (system === null) return null
        const cpu = String(system.cpu ?? '').replace(/\s+/g, ' ').trim()
        const cpuShort = cpu.length > 26 ? `${cpu.slice(0, 26)}…` : cpu
        const item = (key, value) =>
          h('div', { className: 'dlm-res-item', key }, h('span', { className: 'dlm-res-key' }, key), h('span', { className: 'dlm-res-value' }, value))
        return h(
          'div',
          { className: 'dlm-res' },
          item(t('systemTitle'), [cpuShort, t('cores', { n: system.cores })].filter((part) => part.length > 0).join(' · ')),
          item(t('memory'), t('memoryValue', { total: formatBytes(system.totalMemoryBytes), free: formatBytes(system.freeMemoryBytes) })),
          system.disk ? item(t('disk'), t('diskValue', { free: formatBytes(system.disk.freeBytes) })) : null,
        )
      }

      const enginePanel = () => {
        if (engine === null) {
          return h('div', { className: 'dlm-note dlm-note-warn' }, 'The B-1001 engine plugin is not installed, so there is nothing to run models with.')
        }
        return h(
          'div',
          { className: 'dlm-note' + (running ? '' : ' dlm-note-warn') },
          h(
            'div',
            { className: 'dlm-job-head' },
            h('span', null, h('span', { className: 'dlm-code' }, 'B-1001'), t('engineTitle')),
            h('span', { className: 'dlm-status' }, h('span', { className: running ? 'dlm-dot dlm-dot-ok' : 'dlm-dot dlm-dot-bad' }), running ? t('running') : t('stopped')),
          ),
          h(
            'div',
            { className: 'dlm-quiet', style: { marginTop: '4px' } },
            running
              ? `${engine.model} · port ${engine.port} · ${t('context')} ${engine.contextSize}. It appears in the model menu as “Local (built-in)”.`
              : engine.error || engine.missing === 'no-model'
                ? engine.error || 'Choose a model below, then start the engine.'
                : t('stopped'),
          ),
          h(
            'div',
            { style: { display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' } },
            h('button', { type: 'button', className: 'dlm-btn', disabled: pending !== '', onClick: () => void startStop() }, running ? t('stop') : t('start')),
            running
              ? h('button', { type: 'button', className: 'dlm-btn dlm-btn-primary', disabled: pending !== '', onClick: () => void makeDefault() }, t('makeDefault'))
              : null,
          ),
        )
      }

      const shelfBlock = () =>
        h(
          'div',
          null,
          h('div', { className: 'dlm-section-title' }, h('span', null, t('shelf'))),
          models.length === 0
            ? h('div', { className: 'dlm-quiet', style: { marginTop: '6px' } }, t('shelfEmpty'))
            : models.map((model) =>
                h(
                  'div',
                  { className: 'dlm-row', key: model.name },
                  h(
                    'div',
                    { className: 'dlm-row-main' },
                    h('div', { className: 'dlm-name' }, model.name, model.active ? h('span', { className: 'dlm-badge' }, t('loaded')) : null, fitBadge(model.size)),
                    h('div', { className: 'dlm-meta' }, formatBytes(model.size) || t('sizeUnknown')),
                  ),
                  h(
                    'div',
                    { className: 'dlm-actions' },
                    model.active
                      ? null
                      : h('button', { type: 'button', className: 'dlm-btn', disabled: pending !== '', onClick: () => void useModel(model.name) }, t('use')),
                    h('button', { type: 'button', className: 'dlm-btn dlm-btn-danger', disabled: pending !== '', onClick: () => void removeModel(model.name) }, t('remove')),
                  ),
                ),
              ),
        )

      const downloadPanel = () => {
        if (job === null) return null
        if (job.status === 'running') {
          const percent = Math.max(0, Math.min(100, Number(job.percent) || 0))
          return h(
            'div',
            { className: 'dlm-note' },
            h('div', { className: 'dlm-job-head' }, h('span', null, t('downloading', { file: job.file })), h('span', null, `${percent}%`)),
            h('div', { className: 'dlm-bar' }, h('div', { className: 'dlm-bar-fill', style: { width: `${percent}%` } })),
            h('div', { className: 'dlm-job-foot' }, h('span', null, job.total > 0 ? `${formatBytes(job.received)} / ${formatBytes(job.total)}` : formatBytes(job.received)), h('span', null, '“Use” loads it when done')),
          )
        }
        if (job.status === 'done') return h('div', { className: 'dlm-note' }, t('downloadDone', { name: job.name }))
        if (job.status === 'error') return h('div', { className: 'dlm-note dlm-note-bad' }, `${t('downloadFailed')}: ${job.error}`)
        return null
      }

      const fitLevel = (sizeBytes) => {
        const fit = fitOf(sizeBytes, system?.totalMemoryBytes, t)
        return fit === null ? 3 : fit.level === 'good' ? 0 : fit.level === 'tight' ? 1 : 2
      }

      const sortItems = (items) => {
        const copy = items.slice()
        if (sortBy === 'updated') copy.sort((a, b) => String(b.updated).localeCompare(String(a.updated)))
        else if (sortBy === 'downloads') copy.sort((a, b) => b.downloads - a.downloads)
        else if (sortBy === 'name') copy.sort((a, b) => a.repo.localeCompare(b.repo))
        else copy.sort((a, b) => fitLevel(a.sizeBytes) - fitLevel(b.sizeBytes) || String(b.updated).localeCompare(String(a.updated)))
        return copy
      }

      const openDetails = async (repo) => {
        if (details?.repo === repo) {
          setDetails(null)
          return
        }
        setPending(`details:${repo}`)
        try {
          setDetails(await engineApi('GET', `/hub/detail?repo=${encodeURIComponent(repo)}`))
        } catch (failure) {
          setError(String(failure?.message ?? failure))
        } finally {
          setPending('')
        }
      }

      const capChips = (caps, key) =>
        caps.length === 0
          ? null
          : h(
              'span',
              { className: 'dlm-chips', key },
              caps.map((cap) => h('span', { className: 'dlm-chip', key: cap }, cap)),
            )

      const fitChip = (sizeBytes) => {
        const fit = fitOf(sizeBytes, system?.totalMemoryBytes, t)
        if (fit === null) return h('span', { className: 'dlm-fit dlm-fit-tight' }, t('sizeUnknown'))
        return h('span', { className: `dlm-fit dlm-fit-${fit.level}` }, fit.label)
      }

      const detailView = (model) => {
        const fit = fitOf(model.recommendedSize, system?.totalMemoryBytes, t)
        const spec = (key, value) =>
          h('div', { className: 'dlm-spec', key }, h('div', { className: 'dlm-spec-key' }, key), h('div', { className: 'dlm-spec-value' }, value))
        return h(
          'div',
          { className: 'dlm-detail' },
          h(
            'div',
            { className: 'dlm-detail-top' },
            h('button', { type: 'button', className: 'dlm-btn', onClick: () => setDetails(null) }, '← Back'),
            h('span', { className: 'dlm-quiet' }, `${model.downloads.toLocaleString()} downloads · ${model.likes.toLocaleString()} likes`),
          ),
          h('div', { className: 'dlm-detail-title' }, model.repo),
          h('div', { className: 'dlm-quiet', style: { marginTop: '2px' } }, `Last updated: ${agoOf(model.updated)}`),
          h(
            'div',
            { className: 'dlm-detail-caps' },
            model.capabilities.length > 0
              ? model.capabilities.map((cap) => h('span', { className: 'dlm-cap', key: cap }, cap))
              : h('span', { className: 'dlm-quiet' }, 'No capability is declared for this repository.'),
          ),
          h(
            'div',
            { className: 'dlm-specs' },
            spec('Params', model.params || 'unknown'),
            spec('Arch', model.arch || 'unknown'),
            spec('Domain', model.domain || 'llm'),
            spec('Format', model.format || 'GGUF'),
          ),
          fit === null
            ? null
            : h(
                'div',
                { className: 'dlm-note', style: { marginTop: '2px' } },
                h('span', { className: `dlm-fit dlm-fit-${fit.level}` }, fit.label),
                h('span', { className: 'dlm-quiet', style: { marginLeft: '8px' } }, fit.sentence),
              ),
          h('div', { className: 'dlm-section-title', style: { marginTop: '4px' } }, h('span', null, `Download options (${model.files.length})`)),
          model.files.slice(0, 1).map((file) =>
            h(
              'div',
              { className: 'dlm-row', key: file.name },
              h('div', { className: 'dlm-row-main' }, h('div', { className: 'dlm-file-name', style: { fontWeight: 600 } }, file.name), h('div', { className: 'dlm-meta' }, formatBytes(file.size) || t('sizeUnknown'))),
              h(
                'div',
                { className: 'dlm-actions' },
                h('button', { type: 'button', className: 'dlm-btn dlm-btn-primary', disabled: downloading || pending !== '', onClick: () => void downloadFile(model.repo, file.name) }, t('download')),
              ),
            ),
          ),
          model.files.length > 1
            ? h(
                'details',
                { className: 'dlm-fold' },
                h('summary', null, `All ${model.files.length} quantizations`),
                h(
                  'div',
                  { style: { marginTop: '8px' } },
                  model.files.slice(1).map((file) =>
                    h(
                      'div',
                      { className: 'dlm-row', key: file.name },
                      h('div', { className: 'dlm-row-main' }, h('div', { className: 'dlm-file-name', style: { fontWeight: 600 } }, file.name), h('div', { className: 'dlm-meta' }, formatBytes(file.size) || t('sizeUnknown'))),
                      h('div', { className: 'dlm-actions' }, h('button', { type: 'button', className: 'dlm-btn', disabled: downloading || pending !== '', onClick: () => void downloadFile(model.repo, file.name) }, t('download'))),
                    ),
                  ),
                ),
              )
            : null,
          model.description.length > 0
            ? h(
                'div',
                { className: 'dlm-readme' },
                h('div', { className: 'dlm-section-title', style: { marginBottom: '6px' } }, h('span', null, 'README')),
                h('div', { className: 'dlm-readme-text' }, model.description),
              )
            : null,
        )
      }

      const hubBlock = () => {
        if (details !== null) return detailView(details)
        const items = sortItems(Array.isArray(hub?.items) ? hub.items : [])
        return h(
          'div',
          null,
          h(
            'div',
            { className: 'dlm-section-title' },
            h('span', null, t('searchTitle')),
            h(
              'select',
              {
                className: 'dlm-select',
                value: sortBy,
                onChange: (event) => setSortBy(event.target.value),
                'aria-label': 'Sort models',
              },
              h('option', { value: 'fit' }, 'Best for this computer'),
              h('option', { value: 'updated' }, 'Recently updated'),
              h('option', { value: 'downloads' }, 'Most downloaded'),
              h('option', { value: 'name' }, 'Name A–Z'),
            ),
          ),
          h(
            'div',
            { className: 'dlm-search', style: { marginTop: '8px' } },
            h('input', {
              className: 'dlm-input',
              type: 'search',
              value: hubQuery,
              placeholder: t('searchPlaceholder'),
              onChange: (event) => setHubQuery(event.target.value),
              'aria-label': t('searchTitle'),
            }),
          ),
          hub?.error !== undefined ? h('div', { className: 'dlm-note dlm-note-warn', style: { marginTop: '8px' } }, `${t('searchFailed')}: ${hub.error}`) : null,
          h(
            'div',
            { className: 'dlm-scroll', style: { marginTop: '4px' } },
            items.length === 0 && !hubBusy && hub?.error === undefined
              ? h('div', { className: 'dlm-quiet', style: { padding: '8px 0' } }, t('noResults'))
              : null,
            items.slice(0, 20).map((item) => {
              return h(
                'div',
                { key: item.repo },
                h(
                  'div',
                  { className: 'dlm-row' },
                  h(
                    'button',
                    { type: 'button', className: 'dlm-row-main dlm-row-btn', onClick: () => void openDetails(item.repo), 'aria-expanded': open },
                    h(
                      'div',
                      { className: 'dlm-name' },
                      item.repo,
                      fitChip(item.sizeBytes),
                      capChips(item.capabilities, 'caps'),
                    ),
                    h(
                      'div',
                      { className: 'dlm-meta' },
                      [
                        item.sizeBytes > 0 ? formatBytes(item.sizeBytes) : '',
                        `${item.downloads.toLocaleString()} downloads`,
                        item.updated ? `updated ${String(item.updated).slice(0, 10)}` : '',
                        item.gated ? t('gated') : '',
                      ]
                        .filter((part) => typeof part === 'string' && part.length > 0)
                        .join(' · '),
                    ),
                  ),
                  h(
                    'div',
                    { className: 'dlm-actions' },
                    h(
                      'button',
                      { type: 'button', className: 'dlm-btn', disabled: hubBusy || item.gated || pending !== '', onClick: () => void chooseRepo(item.repo) },
                      t('choose'),
                    ),
                  ),
                ),

              )
            }),
          ),
        )
      }

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
          engine === null
            ? null
            : h(
                'div',
                { className: 'dlm-status' },
                h('span', { className: running ? 'dlm-dot dlm-dot-ok' : 'dlm-dot' }),
                running ? t('running') : t('stopped'),
              ),
        ),
        error.length > 0 ? h('div', { className: 'dlm-note dlm-note-bad' }, error) : null,
        notice.length > 0 ? h('div', { className: 'dlm-note' }, notice) : null,
        enginePanel(),
        systemStrip(),
        engine === null ? null : shelfBlock(),
        downloadPanel(),
        engine === null ? null : hubBlock(),
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
