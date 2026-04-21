/**
 * ============================================================================
 * API 客户端 - 访谈回答管理
 * ============================================================================
 */
import client from './client'
import type { Answer } from '../types/answer'

/**
 * 获取项目的所有回答
 * @param projectId - 项目ID
 * @returns 回答列表（包含题目详情和等级选项）
 */
export const listAnswers = (projectId: number) =>
  client.get<Answer[]>(`/projects/${projectId}/answers`)

/**
 * 更新单题回答
 * @param projectId - 项目ID
 * @param questionId - 题目ID
 * @param data - 要更新的字段（等级、内容等）
 */
export const updateAnswer = (projectId: number, questionId: number, data: {
  selected_level?: string
  target_level?: string
  communication_content?: string
  company_status?: string
}) =>
  client.put(`/projects/${projectId}/answers/${questionId}`, data)

/**
 * 批量更新回答（一次性保存多题）
 * @param projectId - 项目ID
 * @param answers - 回答数组（每题一个更新数据）
 */
export const bulkUpdateAnswers = (projectId: number, answers: {
  question_id: number
  selected_level?: string
  target_level?: string
  communication_content?: string
  company_status?: string
}[]) =>
  client.patch(`/projects/${projectId}/answers/bulk`, { answers })
