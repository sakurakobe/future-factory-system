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
 * @returns 报告文件名和生成状态
 */
export const generateReport = (projectId: number) =>
  client.post(`/projects/${projectId}/report/generate`)

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
