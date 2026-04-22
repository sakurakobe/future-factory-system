/**
 * ============================================================================
 * 悬浮分数栏组件 (StickyScoreBar)
 * ============================================================================
 * 功能：
 *   固定在页面底部的分数显示栏，随时显示当前得分进度
 *   支持显示筛选后的分数
 * ============================================================================
 */
import { useAssessmentStore } from '../../store/assessmentStore'

interface Props {
  /** 可见题目ID集合（空或null表示全部显示） */
  visibleIds?: Set<number> | null
}

export default function StickyScoreBar({ visibleIds }: Props) {
  const { score, max } = useAssessmentStore(s => s.getTotalScore())
  const answers = useAssessmentStore(s => s.answers)
  const categories = useAssessmentStore(s => s.categories)
  const pct = max > 0 ? Math.round(score / max * 100) : 0
  const barColor = pct >= 60 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'

  // 筛选后的分数
  let filteredScore = score
  let filteredMax = max
  let isFiltered = false

  if (visibleIds && visibleIds.size > 0) {
    isFiltered = true
    filteredScore = 0
    filteredMax = 0
    for (const major of categories) {
      for (const sub of major.sub_categories) {
        for (const ss of sub.sub_sub_categories) {
          for (const q of ss.questions) {
            if (visibleIds.has(q.id)) {
              filteredMax += q.max_score
              filteredScore += answers[q.id]?.score ?? 0
            }
          }
        }
      }
    }
    filteredScore = Math.round(filteredScore * 100) / 100
  }

  const fPct = filteredMax > 0 ? Math.round(filteredScore / filteredMax * 100) : 0
  const fBarColor = fPct >= 60 ? 'bg-green-500' : fPct >= 40 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg px-6 py-2.5">
      <div className="flex items-center gap-6">
        {/* 总分 */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-medium">总分</span>
          <span className="text-lg font-bold text-gray-900">{score.toFixed(1)}</span>
          <span className="text-xs text-gray-400">/ {max} 分</span>
          <div className="w-28 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-gray-500 font-medium">{pct}%</span>
        </div>

        {/* 筛选后分数 */}
        {isFiltered && (
          <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
            <span className="text-xs text-blue-500 font-medium">筛选</span>
            <span className="text-lg font-bold text-blue-600">{filteredScore.toFixed(1)}</span>
            <span className="text-xs text-gray-400">/ {filteredMax} 分</span>
            <div className="w-28 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${fBarColor}`} style={{ width: `${fPct}%` }} />
            </div>
            <span className="text-xs text-gray-500 font-medium">{fPct}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
