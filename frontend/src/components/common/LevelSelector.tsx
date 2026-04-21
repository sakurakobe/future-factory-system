/**
 * ============================================================================
 * 等级选择器组件 (LevelSelector)
 * ============================================================================
 * 功能：
 *   提供 A-F 等级按钮组，供用户选择沟通等级或目标等级。
 *
 * 交互：
 *   - 点击按钮选中对应等级
 *   - 再次点击同一按钮取消选中（toggle行为）
 *   - 选中按钮高亮显示（蓝色背景）
 *   - 悬浮提示显示等级和对应分值
 * ============================================================================
 */
import { useAssessmentStore } from '../../store/assessmentStore'

interface Props {
  /** 等级选项列表，如 [{level:"A", score:0}, {level:"B", score:1}, ...] */
  options: { level: string; score: number }[]
  /** 当前选中的等级，null 表示未选中 */
  value: string | null
  /** 选中变化时的回调 */
  onChange: (level: string) => void
}

export default function LevelSelector({ options, value, onChange }: Props) {
  return (
    <div className="flex gap-1">
      {options.map(opt => (
        <button
          key={opt.level}
          // 点击切换：已选中则取消，未选中则选中
          onClick={() => onChange(opt.level === value ? '' : opt.level)}
          className={`w-10 h-10 rounded-lg font-bold text-sm transition ${
            value === opt.level
              ? 'bg-blue-600 text-white shadow'  // 已选中：蓝色背景
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'  // 未选中：灰色
          }`}
          title={`${opt.level}级 (${opt.score}分)`}  // 悬浮提示
        >
          {opt.level}
        </button>
      ))}
    </div>
  )
}
