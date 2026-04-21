/**
 * ============================================================================
 * API 客户端 - 分类管理
 * ============================================================================
 */
import client from './client'
import type { CategoryTree } from '../types/category'

/**
 * 获取完整分类树（含所有题目和等级选项）
 * @param companyType - 企业类型（通用/离散/流程），用于过滤行业专属题目
 * @returns 返回四级嵌套的分类树数据
 */
export const getCategories = (companyType: string = '通用') =>
  client.get<CategoryTree>(`/categories/tree?company_type=${encodeURIComponent(companyType)}`)
