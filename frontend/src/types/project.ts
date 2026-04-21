/**
 * ============================================================================
 * 项目类型定义
 * ============================================================================
 */

/**
 * 评估项目（从后端读取的完整数据）
 */
export interface Project {
  id: number
  company_name: string
  company_type: string
  assessment_start_date: string
  assessment_end_date: string
  assessors: string
  created_at: string
  updated_at: string
  status: string
}

/**
 * 创建项目的请求体（部分字段可选）
 */
export interface ProjectCreate {
  company_name: string
  company_type?: string
  assessment_start_date?: string
  assessment_end_date?: string
  assessors?: string
}
