/**
 * ============================================================================
 * 全局状态管理 (Zustand Store)
 * ============================================================================
 * 功能：
 *   管理评估系统的全局状态，包括分类树、回答数据、加载状态等。
 *
 * 核心数据结构：
 *   - categories: MajorCategory[]     分类树（只读，从后端获取）
 *   - answers: Record<number, Answer> 回答数据（key = question_id，可读写）
 *
 * 使用方式（在组件中）：
 *   const { categories, loadCategories, setAnswer } = useAssessmentStore()
 *
 * 评分计算（前端）：
 *   - getScoreForQuestion: 获取单题得分
 *   - getScoreForCategory: 获取子类/细项级别的得分
 *   - getTotalScore: 获取总分
 *
 * 优化说明：
 *   - 使用乐观更新（Optimistic Update），先更新UI再调用API
 *   - API调用失败时UI已更新，用户无感知延迟
 * ============================================================================
 */
import { create } from 'zustand'
import { getCategories, listAnswers, updateAnswer, bulkUpdateAnswers } from '../api'
import type { MajorCategory } from '../types/category'
import type { Answer } from '../types/answer'

/** 全局状态类型定义 */
interface AssessmentState {
  // ---- 数据 ----
  /** 分类树（方面 → 子类 → 细项 → 题目） */
  categories: MajorCategory[]
  /** 回答数据，以 question_id 为 key 的字典 */
  answers: Record<number, Answer>
  /** 加载状态 */
  loading: boolean
  /** 错误信息 */
  error: string | null

  // ---- 操作方法 ----
  /** 加载分类树数据（传入 companyType 用于过滤离散/流程题目） */
  loadCategories: (companyType?: string) => Promise<void>
  /** 加载指定项目的所有回答 */
  loadAnswers: (projectId: number) => Promise<void>
  /** 清空回答数据（切换项目时使用） */
  clearAnswers: () => void
  /** 更新单题回答（乐观更新 + API调用） */
  setAnswer: (projectId: number, questionId: number, data: {
    selected_level?: string | null
    target_level?: string | null
    communication_content?: string
    company_status?: string
  }) => void
  /** 批量更新回答 */
  bulkSetAnswers: (projectId: number, answers: any[]) => void
  /** 获取单题得分 */
  getScoreForQuestion: (questionId: number) => number
  /** 获取细项级别得分（含满分） */
  getScoreForCategory: (categoryId: number) => { score: number; max: number }
  /** 获取总分（含满分） */
  getTotalScore: () => { score: number; max: number }
}

export const useAssessmentStore = create<AssessmentState>((set, get) => ({
  categories: [],
  answers: {},
  loading: false,
  error: null,

  clearAnswers: () => set({ answers: {} }),

  /**
   * 加载分类树数据
   * 根据 companyType 自动过滤离散/流程行业题目
   * @param companyType - 企业类型（通用/离散/流程）
   */
  loadCategories: async (companyType = '通用') => {
    set({ loading: true, error: null })
    try {
      const res = await getCategories(companyType)
      set({ categories: res.data.categories, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  /**
   * 加载指定项目的所有回答
   * 切换到项目详情页面时调用，获取已有回答数据
   */
  loadAnswers: async (projectId: number) => {
    set({ loading: true, error: null })
    try {
      const res = await listAnswers(projectId)
      const answersMap: Record<number, Answer> = {}
      // 将回答列表转为 question_id → answer 的字典，方便快速查找
      res.data.forEach((a: any) => {
        // 如果 selected_level 为空，强制 score 为 0（防止数据库有脏数据）
        if (!a.selected_level && a.score) {
          a.score = 0
        }
        answersMap[a.question_id] = a
      })
      set({ answers: answersMap, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  /**
   * 更新单题回答（核心方法）
   *
   * 流程：
   *   1. 乐观更新：先更新本地状态，UI立即响应
   *   2. 重新计算得分：从题目选项中找到对应等级的分值
   *      - 单选题：单个等级的分值
   *      - 多选题：所有选中等级（逗号分隔）的分值之和
   *   3. 后台调用API：将修改保存到数据库
   *
   * @param projectId - 项目ID
   * @param questionId - 题目ID
   * @param data - 要更新的字段（部分更新）
   */
  setAnswer: async (projectId, questionId, data) => {
    // 步骤1：获取当前回答（不存在则创建默认对象）
    const current = get().answers[questionId] || {
      id: 0, question_id: questionId, question: {} as any,
      selected_level: null, target_level: null,
      communication_content: null, company_status: null,
      score: null, is_applicable: 1,
    }
    // 步骤2：合并新数据
    const updated = { ...current, ...data }

    // 步骤3：如果修改了沟通等级，重新计算得分
    if (data.selected_level) {
      const q = get().answers[questionId]?.question
      if (q?.options) {
        const optMap = new Map(q.options.map((o: any) => [o.level, o.score]))
        // 支持多选题：逗号分隔多个等级，求和
        const levels = data.selected_level.split(',').map((s: string) => s.trim()).filter(Boolean)
        updated.score = levels.reduce((sum: number, lvl: string) => sum + (optMap.get(lvl) ?? 0), 0)
      }
    }
    // 步骤4：更新本地状态（乐观更新，UI立即响应）
    set({ answers: { ...get().answers, [questionId]: updated } })

    // 步骤5：后台调用API保存到数据库
    try {
      await updateAnswer(projectId, questionId, data)
    } catch (e: any) {
      console.error('Failed to save answer:', e)
    }
  },

  /**
   * 批量更新回答
   *
   * 流程与 setAnswer 类似，但一次性更新多题
   */
  bulkSetAnswers: async (projectId, answers) => {
    // 乐观更新
    const newAnswers = { ...get().answers }
    answers.forEach(a => {
      const current = newAnswers[a.question_id] || {
        id: 0, question_id: a.question_id, question: {} as any,
        selected_level: null, target_level: null,
        communication_content: null, company_status: null,
        score: null, is_applicable: 1,
      }
      newAnswers[a.question_id] = { ...current, ...a }
    })
    set({ answers: newAnswers })

    // 后台保存
    try {
      await bulkUpdateAnswers(projectId, answers)
    } catch (e: any) {
      console.error('Failed to bulk save:', e)
    }
  },

  /**
   * 获取单题得分
   * 从 answers 字典中查找，返回0表示未选择等级
   */
  getScoreForQuestion: (questionId: number) => {
    const answer = get().answers[questionId]
    return answer?.score ?? 0
  },

  /**
   * 获取细项（三级分类）级别得分
   * 遍历细项下所有题目，累加得分
   *
   * @param categoryId - 细项ID（sub_sub_category.id）
   * @returns { score, max } - 得分和满分
   */
  getScoreForCategory: (categoryId: number) => {
    let score = 0
    const categories = get().categories
    let targetSubSub: any = null

    // 在分类树中查找指定ID的细项
    for (const major of categories) {
      for (const sub of major.sub_categories) {
        for (const ss of sub.sub_sub_categories) {
          if (ss.id === categoryId) {
            targetSubSub = ss
            break
          }
        }
        if (targetSubSub) break
      }
      if (targetSubSub) break
    }

    if (!targetSubSub) return { score: 0, max: 0 }

    // 累加细项下所有题目的得分
    for (const q of targetSubSub.questions) {
      score += get().getScoreForQuestion(q.id)
    }

    return { score, max: targetSubSub.max_score }
  },

  /**
   * 获取项目总分
   * 遍历分类树中所有题目，累加所有得分
   *
   * @returns { score, max } - 总分和满分
   */
  getTotalScore: () => {
    let score = 0
    let max = 0
    const categories = get().categories
    const answers = get().answers

    // 遍历 方面 → 子类 → 细项 → 题目
    for (const major of categories) {
      for (const sub of major.sub_categories) {
        for (const ss of sub.sub_sub_categories) {
          for (const q of ss.questions) {
            max += q.max_score
            score += answers[q.id]?.score ?? 0
          }
        }
      }
    }

    return { score: Math.round(score * 100) / 100, max }
  },
}))
