/**
 * ============================================================================
 * 总分汇总组件 (ScoreSummary)
 * ============================================================================
 * 功能：
 *   显示项目总分的大数字和进度条。
 *   通常放在项目详情页面顶部，方便实时查看总得分。
 *
 * 显示内容：
 *   - 总分（大字，如 228.34）
 *   - 满分和得分率（如 "/ 500 分 (45.67%)"）
 *   - 进度条（颜色随得分率变化）
 *
 * 颜色规则：
 *   ≥60%: 绿色进度条
 *   40-60%: 黄色进度条
 *   <40%: 红色进度条
 * ============================================================================
 */
import { useAssessmentStore } from '../../store/assessmentStore'

export default function ScoreSummary() {
  const { getTotalScore } = useAssessmentStore.getState()
  const { score, max } = getTotalScore()
  const pct = max > 0 ? Math.round(score / max * 100) : 0
  // 根据得分率确定进度条颜色
  const color = pct >= 60 ? 'bg-green-600' : pct >= 40 ? 'bg-yellow-600' : 'bg-red-600'

  return (
    <div className="text-right">
      {/* 总分数字（大字） */}
      <div className="text-3xl font-bold text-gray-900">{score.toFixed(2)}</div>
      {/* 满分和得分率 */}
      <div className="text-sm text-gray-500">/ {max} 分 ({pct}%)</div>
      {/* 进度条 */}
      <div className={`w-48 h-2 rounded-full mt-2 ${color}`} />
    </div>
  )
}
