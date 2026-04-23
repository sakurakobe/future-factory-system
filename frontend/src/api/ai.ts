/**
 * API 客户端 - AI 设置管理
 */
import client from './client'

export interface AISettings {
  configured: boolean
  base_url: string
  model: string
  enabled: boolean
}

export interface AISettingsSave {
  base_url: string
  api_key: string
  model: string
  enabled: boolean
}

export const getAISettings = () =>
  client.get<AISettings>('/ai/status')

export const saveAISettings = (settings: AISettingsSave) =>
  client.post('/ai/settings', settings)

export const getAIModels = () =>
  client.get<{ models: string[] }>('/ai/models')

/**
 * 测试 AI 连接（不保存配置）
 */
export const testAIConnection = (baseUrl: string, apiKey: string) =>
  client.post<{
    success: boolean
    message: string
    models: string[]
    detail?: string
  }>('/ai/test', { base_url: baseUrl, api_key: apiKey })

// API Key 存储到 localStorage
const AI_CONFIG_KEY = 'ai_config'

export const saveLocalAIConfig = (baseUrl: string, apiKey: string, model: string, enabled: boolean) => {
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify({ base_url: baseUrl, api_key: apiKey, model, enabled }))
}

export const getLocalAIConfig = (): { base_url: string; api_key: string; model: string; enabled: boolean } | null => {
  const raw = localStorage.getItem(AI_CONFIG_KEY)
  if (!raw) return null
  return JSON.parse(raw)
}
