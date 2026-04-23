/**
 * ============================================================================
 * API 客户端 - 报告管理
 * ============================================================================
 */
import client from './client'

/**
 * 获取得分汇总（含雷达图数据）
 * @param projectId - 项目ID
 * @returns ScoreSummary 对象（总分、各大类得分、雷达图数据点）
 */
export const getScoreSummary = (projectId: number) =>
  client.get(`/projects/${projectId}/score-summary`)

/**
 * 生成诊断评估报告（Word文档）
 * @param projectId - 项目ID
 * @param useAi - 是否使用 AI 增强
 * @returns 报告文件名和生成状态
 */
export const generateReport = (projectId: number, useAi: boolean = false) =>
  client.post(`/projects/${projectId}/report/generate`, { use_ai: useAi })

/**
 * SSE 流式生成报告，返回进度回调
 * @param projectId - 项目ID
 * @param useAi - 是否使用 AI 增强
 * @param onProgress - 进度回调 (step, pct, ai)
 * @returns Promise<string> 完成后的文件名
 */
export const generateReportStream = (
  projectId: number,
  useAi: boolean,
  onProgress: (step: string, pct: number, ai: boolean) => void,
): Promise<string> => {
  return fetch(`/api/projects/${projectId}/report/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ use_ai: useAi }),
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`报告生成失败: ${response.status}`)
    }
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      let eventType = ''
      let eventData = ''

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7)
        } else if (line.startsWith('data: ')) {
          eventData = line.slice(6)
        } else if (line === '' && eventType && eventData) {
          // Dispatch event
          if (eventType === 'progress') {
            const d = JSON.parse(eventData)
            onProgress(d.step, d.pct, d.ai || false)
          } else if (eventType === 'ready') {
            const d = JSON.parse(eventData)
            return d.filename
          } else if (eventType === 'error') {
            const d = JSON.parse(eventData)
            throw new Error(d.message || '未知错误')
          }
          eventType = ''
          eventData = ''
        }
      }
    }

    // Process remaining buffer
    if (buffer) {
      const lines2 = buffer.split('\n')
      let eventType2 = ''
      let eventData2 = ''
      for (const line of lines2) {
        if (line.startsWith('event: ')) eventType2 = line.slice(7)
        else if (line.startsWith('data: ')) eventData2 = line.slice(6)
      }
      if (eventType2 === 'ready' && eventData2) {
        return JSON.parse(eventData2).filename
      }
    }

    throw new Error('流式连接意外关闭')
  })
}

/**
 * 下载诊断评估报告（Word文档）
 * @param projectId - 项目ID
 * @description 新窗口打开下载链接，浏览器自动触发文件下载
 */
export const downloadReport = (projectId: number) => {
  window.open(`/api/projects/${projectId}/report/download`, '_blank')
}

/**
 * 导出 Excel 评估结果
 * @param projectId - 项目ID
 * @description 新窗口打开下载链接，浏览器自动触发文件下载
 */
export const downloadExcel = (projectId: number) => {
  window.open(`/api/projects/${projectId}/excel/export`, '_blank')
}
