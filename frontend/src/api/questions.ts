/**
 * ============================================================================
 * API 客户端 - 题目管理
 * ============================================================================
 * 功能：
 *   提供题目的增删改查接口，支持在线管理题目数据。
 *
 * API 端点：
 *   GET    /api/questions?sub_sub_category_id=N  - 查询细项下的所有题目
 *   GET    /api/questions/{id}                   - 查询单个题目
 *   POST   /api/questions                        - 新增题目
 *   PUT    /api/questions/{id}                   - 修改题目
 *   DELETE /api/questions/{id}                   - 删除题目
 * ============================================================================
 */
import client from './client'

/** 等级选项（每题6个，A-F） */
export interface LevelOption {
  level: string
  score: number
  description: string
  target_level: string
}

/** 新增题目请求体 */
export interface CreateQuestionPayload {
  sub_sub_category_id: number
  sort_order: number
  title: string
  max_score: number
  industry_type: string
  options: LevelOption[]
}

/** 修改题目请求体（部分字段） */
export interface UpdateQuestionPayload {
  sort_order?: number
  title?: string
  max_score?: number
  industry_type?: string
  responsible_dept?: string
  options?: LevelOption[]
}

/** 查询指定细项下的所有题目 */
export const listQuestions = (subSubCategoryId: number) =>
  client.get<any[]>(`/questions?sub_sub_category_id=${subSubCategoryId}`)

/** 查询单个题目详情 */
export const getQuestion = (id: number) =>
  client.get<any>(`/questions/${id}`)

/** 新增题目 */
export const createQuestion = (data: CreateQuestionPayload) =>
  client.post('/questions', data)

/** 修改题目 */
export const updateQuestion = (id: number, data: UpdateQuestionPayload) =>
  client.put(`/questions/${id}`, data)

/** 删除题目 */
export const deleteQuestion = (id: number) =>
  client.delete(`/questions/${id}`)

/** 获取所有已填写的责任部门列表 */
export const listDepartments = () =>
  client.get<{ departments: string[] }>('/departments')
