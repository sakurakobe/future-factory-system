/**
 * ============================================================================
 * 分类和题目类型定义
 * ============================================================================
 * 四级嵌套结构：
 *   CategoryTree → MajorCategory → SubCategory → SubSubCategory → Question → LevelOption
 * ============================================================================
 */

/**
 * 单个等级选项（每题6个，对应A-F级）
 */
export interface LevelOption {
  level: string          // 等级标识
  score: number          // 对应分值
  description: string    // 等级描述
  target_level: string   // 建议等级
}

/**
 * 评估题目
 */
export interface Question {
  id: number
  sort_order: number
  title: string
  max_score: number
  industry_type: string
  is_multi_select: number
  options: LevelOption[]
}

/**
 * 细项（三级分类，包含题目列表）
 */
export interface SubSubCategory {
  id: number
  sort_order: number
  name: string
  max_score: number
  questions: Question[]
}

/**
 * 子类（二级分类，包含细项列表）
 */
export interface SubCategory {
  id: number
  sort_order: number
  name: string
  max_score: number
  description: string
  sub_sub_categories: SubSubCategory[]
}

/**
 * 主要方面（一级分类，包含子类列表）
 */
export interface MajorCategory {
  id: number
  sort_order: number
  name: string
  max_score: number
  description: string
  sub_categories: SubCategory[]
}

/**
 * 分类树根节点（API 响应格式）
 */
export interface CategoryTree {
  categories: MajorCategory[]
}
