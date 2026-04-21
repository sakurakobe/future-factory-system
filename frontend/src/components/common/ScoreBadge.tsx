/**
 * ============================================================================
 * 得分徽章组件 (ScoreBadge)
 * ============================================================================
 * 功能：
 *   以徽章形式展示得分，格式：xx.xx / max (pct%)
 *   根据得分率自动着色：
 *     ≥60%: 绿色（良好）
 *     40-60%: 黄色（一般）
 *     <40%: 红色（较差）
 *
 * 尺寸：
 *   sm: 小尺寸（题目卡片内）
 *   md: 中尺寸（默认，默认使用）
 *   lg: 大尺寸（报告页面）
 * ============================================================================
 */
interface Props {
  /** 当前得分 */
  score: number
  /** 满分 */
  maxScore: number
  /** 尺寸（可选，默认md） */
  size?: 'sm' | 'md' | 'lg'
}

export default function ScoreBadge({ score, maxScore, size = 'md' }: Props) {
  // 计算得分率
  const pct = maxScore > 0 ? Math.round(score / maxScore * 100) : 0
  // 根据得分率确定颜色
  const color = pct >= 60 ? 'bg-green-100 text-green-800' : pct >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'

  // 根据尺寸确定字体和间距
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-lg px-4 py-2' : 'text-sm px-3 py-1'

  return (
    <span className={`inline-block rounded-full font-medium ${color} ${sizeClass}`}>
      {score.toFixed(2)} / {maxScore} ({pct}%)
    </span>
  )
}
