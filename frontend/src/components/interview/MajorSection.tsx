/**
 * ============================================================================
 * 大类区域组件 (MajorSection)
 * ============================================================================
 * 功能：渲染一个主要方面（如"赋能保障"）的完整区域。
 * ============================================================================
 */
import { useAssessmentStore } from '../../store/assessmentStore'
import CollapsePanel from '../common/CollapsePanel'
import InterviewNotes from './InterviewNotes'
import SubSection from './SubSection'

interface Props {
  major: {
    id: number
    sort_order: number
    name: string
    max_score: number
    description: string
    sub_categories: any[]
  }
  showManage?: boolean
  onQuestionChange?: () => void
  visibleIds?: Set<number> | null | undefined
}

export default function MajorSection({ major, showManage, onQuestionChange, visibleIds }: Props) {
  const answers = useAssessmentStore(s => s.answers)

  // 计算大类总得分
  let score = 0
  let totalMax = 0
  major.sub_categories.forEach(sub => {
    sub.sub_sub_categories.forEach((ss: any) => {
      ss.questions.forEach((q: any) => {
        score += answers[q.id]?.score ?? 0
        totalMax += q.max_score
      })
    })
  })

  const pct = totalMax > 0 ? Math.round(score / totalMax * 100) : 0
  const barColor = pct >= 60 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'

  // 检查是否有任何可见题目
  const hasVisibleQuestion = (ids: Set<number> | null | undefined) => {
    if (!ids || ids.size === 0) return true
    for (const sub of major.sub_categories) {
      for (const ss of sub.sub_sub_categories) {
        for (const q of ss.questions) {
          if (ids.has(q.id)) return true
        }
      }
    }
    return false
  }

  if (!hasVisibleQuestion(visibleIds)) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 大类头部 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm">
            {major.sort_order}
          </span>
          <h2 className="text-lg font-bold text-gray-900">{major.name}</h2>
        </div>
        <div className="flex items-center gap-4">
          {/* 进度条 */}
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              {score.toFixed(1)} / {totalMax}
            </span>
          </div>
        </div>
      </div>

      {/* 大类内容 */}
      <div className="p-5">
        {/* 整体备注 */}
        <div className="mb-5">
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-sm text-gray-500 hover:text-gray-700 transition select-none">
              <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              整体备注（小组讨论记录）
            </summary>
            <div className="mt-2 pl-6">
              <InterviewNotes majorId={major.id} />
            </div>
          </details>
        </div>

        {/* 大类描述 */}
        {major.description && (
          <p className="text-sm text-gray-500 mb-5 bg-blue-50/50 p-3 rounded-lg border border-blue-100">{major.description}</p>
        )}

        {/* 子类列表 */}
        <div className="space-y-4">
          {major.sub_categories.map(sub => (
            <SubSection
              key={sub.id}
              subCategory={sub}
              showManage={showManage}
              onQuestionChange={onQuestionChange}
              visibleIds={visibleIds}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
