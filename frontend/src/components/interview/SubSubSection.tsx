/**
 * ============================================================================
 * 细项区域组件 (SubSubSection)
 * ============================================================================
 * 功能：渲染一个细项（如"新一代信息技术"）的区域，包含所有题目卡片。
 * ============================================================================
 */
import { useAssessmentStore } from '../../store/assessmentStore'
import QuestionCard from './QuestionCard'

interface Props {
  subSubCategory: {
    id: number
    name: string
    max_score: number
    questions: any[]
  }
  showManage?: boolean
  onQuestionChange?: () => void
  visibleIds?: Set<number> | null
}

export default function SubSubSection({ subSubCategory, showManage, onQuestionChange, visibleIds }: Props) {
  const answers = useAssessmentStore(s => s.answers)

  // 计算细项总得分
  let score = 0
  subSubCategory.questions.forEach(q => {
    score += answers[q.id]?.score ?? 0
  })

  // 筛选可见题目
  const visibleQuestions = visibleIds && visibleIds.size > 0
    ? subSubCategory.questions.filter(q => visibleIds.has(q.id))
    : subSubCategory.questions

  // 无可见题目则隐藏
  if (visibleQuestions.length === 0 && visibleIds && visibleIds.size > 0) return null

  return (
    <div id={`question-area-${subSubCategory.id}`} className="ml-3">
      {/* 细项标题行 */}
      <div className="flex items-center gap-2 mb-2.5 py-2 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500">{subSubCategory.name}</span>
        <div className="flex-1 h-px bg-gray-100" />
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          score >= subSubCategory.max_score * 0.8
            ? 'bg-green-100 text-green-700'
            : score >= subSubCategory.max_score * 0.5
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {score.toFixed(1)} / {subSubCategory.max_score}
        </span>
        {showManage && (
          <button
            onClick={() => {/* handled by parent */}}
            className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition ml-1"
          >
            + 新增
          </button>
        )}
      </div>

      {/* 题目卡片列表 */}
      <div className="space-y-2">
        {visibleQuestions.map(q => (
          <QuestionCard
            key={q.id}
            question={q}
            showManage={showManage}
            onQuestionChange={onQuestionChange}
          />
        ))}
      </div>
    </div>
  )
}
