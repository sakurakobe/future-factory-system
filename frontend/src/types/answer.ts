/**
 * ============================================================================
 * 回答类型定义
 * ============================================================================
 */
import { Question } from './category'

/**
 * 评估回答（项目中单题的评估结果）
 */
export interface Answer {
  id: number
  question_id: number
  question: Question              // 关联题目信息
  selected_level: string | null   // 沟通等级（A-F）
  target_level: string | null     // 目标等级（A-F）
  communication_content: string | null  // 沟通内容
  company_status: string | null   // 企业现状
  score: number | null            // 自动得分
  is_applicable: number           // 是否适用（1=是, 0=否）
}
