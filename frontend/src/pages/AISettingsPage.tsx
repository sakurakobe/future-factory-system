import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAISettings, saveAISettings, testAIConnection, saveLocalAIConfig } from '../api/ai'
import type { AISettings } from '../api/ai'

// 常用 AI 服务预设
const PROVIDER_PRESETS: Record<string, { label: string; baseUrl: string; defaultModel: string }> = {
  openai: { label: 'OpenAI', baseUrl: 'https://api.openai.com', defaultModel: 'gpt-3.5-turbo' },
  qwen: { label: '通义千问', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode', defaultModel: 'qwen-turbo' },
  zhipu: { label: '智谱 AI', baseUrl: 'https://open.bigmodel.cn', defaultModel: 'glm-4-flash' },
  deepseek: { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com', defaultModel: 'deepseek-chat' },
  custom: { label: '自定义', baseUrl: '', defaultModel: '' },
}

export default function AISettingsPage() {
  const navigate = useNavigate()
  const [preset, setPreset] = useState('custom')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState('')
  const [modelList, setModelList] = useState<string[]>([])

  useEffect(() => {
    getAISettings().then(r => {
      const cfg = r.data
      if (cfg.configured) {
        setBaseUrl(cfg.base_url)
        setModel(cfg.model)
        setEnabled(cfg.enabled)
        // 匹配预设
        for (const [key, val] of Object.entries(PROVIDER_PRESETS)) {
          if (val.baseUrl === cfg.base_url) {
            setPreset(key)
            break
          }
        }
      }
    }).catch(() => {})
  }, [])

  const handlePresetChange = (key: string) => {
    setPreset(key)
    const p = PROVIDER_PRESETS[key]
    if (p) {
      setBaseUrl(p.baseUrl)
      setModel(p.defaultModel)
    }
  }

  const handleSave = async () => {
    if (!baseUrl || !apiKey || !model) {
      setMessage('请填写所有字段')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      await saveAISettings({ base_url: baseUrl, api_key: apiKey, model, enabled })
      saveLocalAIConfig(baseUrl, apiKey, model, enabled)
      setMessage('配置已保存')
    } catch (e: any) {
      setMessage('保存失败：' + (e.response?.data?.detail || e.message))
    }
    setLoading(false)
  }

  const handleTest = async () => {
    if (!baseUrl || !apiKey) {
      setMessage('请先填写 Base URL 和 API Key')
      return
    }
    setTesting(true)
    setMessage('')
    setModelList([])
    try {
      const r = await testAIConnection(baseUrl, apiKey)
      const result = r.data
      if (result.success) {
        setModelList(result.models || [])
        const modelStr = (result.models || []).slice(0, 5).join(', ')
        setMessage('连接成功！可用模型：' + modelStr + ((result.models?.length || 0) > 5 ? '...' : ''))
      } else {
        setMessage('连接失败：' + result.message + (result.detail ? ' (' + result.detail.slice(0, 100) + ')' : ''))
      }
    } catch (e: any) {
      setMessage('连接失败：' + (e.response?.data?.message || e.response?.data?.detail || e.message || '未知错误'))
    }
    setTesting(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">AI 增强配置</h2>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-gray-700 transition"
          >
            ← 返回
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          配置大模型 API 后，可在生成报告时使用 AI 自动润色"企业现状与差距"和"对标未来工厂建议的提升点"等内容。
        </p>

        {/* 服务提供方 */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">服务提供方</label>
          <select
            value={preset}
            onChange={e => handlePresetChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(PROVIDER_PRESETS).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        {/* Base URL */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
          <input
            type="text"
            value={baseUrl}
            onChange={e => setBaseUrl(e.target.value)}
            placeholder="https://api.openai.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* API Key */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Model */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">模型名称</label>
          <input
            type="text"
            value={model}
            onChange={e => setModel(e.target.value)}
            placeholder="gpt-3.5-turbo"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 启用开关 */}
        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative w-11 h-6 rounded-full transition ${
              enabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              enabled ? 'translate-x-5' : ''
            }`} />
          </button>
          <span className="text-sm text-gray-700">启用 AI 报告增强</span>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {loading ? '保存中...' : '保存配置'}
          </button>
          <button
            onClick={handleTest}
            disabled={testing}
            className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm"
          >
            {testing ? '测试中...' : '测试连接'}
          </button>
        </div>

        {/* 消息提示 */}
        {message && (
          <div className={`text-sm px-4 py-3 rounded-lg ${
            message.includes('成功') || message.includes('已保存')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* 模型列表 */}
        {modelList.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-2">可用模型：</p>
            <div className="flex flex-wrap gap-2">
              {modelList.slice(0, 10).map(m => (
                <span
                  key={m}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                  onClick={() => setModel(m)}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
