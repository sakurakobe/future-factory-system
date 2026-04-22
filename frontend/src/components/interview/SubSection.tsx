/**
 * ============================================================================
 * 子类区域组件 (SubSection)
 * ============================================================================
 * 功能：渲染一个子类（如"技术支撑"）的区域，包含描述和所有细项。
 * ============================================================================
 */
import { useAssessmentStore } from '../../store/assessmentStore'
import SubSubSection from './SubSubSection'

interface Props {
  subCategory: {
    id: number
    name: string
    max_score: number
    description: string
    sub_sub_categories: any[]
  }
  showManage?: boolean
  onQuestionChange?: () => void
  visibleIds?: Set<number> | null | undefined
}

export default function SubSection({ subCategory, showManage, onQuestionChange, visibleIds }: Props) {
  const answers = useAssessmentStore(s => s.answers)

  // 计算子类总得分
  let score = 0
  let totalMax = 0
  subCategory.sub_sub_categories.forEach(ss => {
    ss.questions.forEach((q: any) => {
      score += answers[q.id]?.score ?? 0
      totalMax += q.max_score
    })
  })

  const pct = totalMax > 0 ? Math.round(score / totalMax * 100) : 0

  // 检查是否有任何可见题目
  const hasVisibleQuestion = (ids: Set<number> | null | undefined) => {
    if (!ids || ids.size === 0) return true
    for (const ss of subCategory.sub_sub_categories) {
      for (const q of ss.questions) {
        if (ids.has(q.id)) return true
      }
    }
    return false
  }

  if (!hasVisibleQuestion(visibleIds)) return null

  return (
    <div>
      {/* 子类标题行 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-1 rounded-full bg-indigo-400" />
        <h3 className="text-sm font-bold text-gray-800">{subCategory.name}</h3>
        <span className="text-xs text-gray-400 ml-auto">
          {score.toFixed(1)} / {totalMax} · {pct}%
        </span>
      </div>

      {/* 子类描述 */}
      {subCategory.description && (
        <p className="text-xs text-gray-400 mb-3 pl-3">{subCategory.description}</p>
      )}

      {/* 细项列表 */}
      <div className="space-y-3">
        {subCategory.sub_sub_categories.map(ss => (
          <SubSubSection
            key={ss.id}
            subSubCategory={ss}
            showManage={showManage}
            onQuestionChange={onQuestionChange}
            visibleIds={visibleIds}
          />
        ))}
      </div>
    </div>
  )
}
