/**
 * ============================================================================
 * 总分汇总组件 (ScoreSummary)
 * ============================================================================
 */
import { useAssessmentStore } from '../../store/assessmentStore'

export default function ScoreSummary() {
  const { score, max } = useAssessmentStore(s => s.getTotalScore())
  const pct = max > 0 ? Math.round(score / max * 100) : 0
  const barColor = pct >= 60 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <div className="text-2xl font-bold text-gray-900">{score.toFixed(1)}</div>
        <div className="text-xs text-gray-400">/ {max} 分 ({pct}%)</div>
      </div>
      <div className="w-36 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
