/**
 * ============================================================================
 * 大类区域组件 (MajorSection)
 * ============================================================================
 * 功能：
 *   渲染一个主要方面（如"赋能保障"）的完整区域。
 *   包含整体备注（小组讨论记录）和所有子类。
 *
 * 层级：方面 → 子类(SubSection) → 细项(SubSubSection) → 题目(QuestionCard)
 *
 * 特性：
 *   - 得分率颜色标识：≥60%绿, 40-60%黄, <40%红
 *   - 默认展开状态（方便快速录入）
 *   - 顶部有"整体备注"文本框
 *   - 支持管理模式下显示题目增删改按钮
 * ============================================================================
 */
import { useAssessmentStore } from '../../store/assessmentStore'
import SubSection from './SubSection'
import CollapsePanel from '../common/CollapsePanel'
import InterviewNotes from './InterviewNotes'

interface Props {
  major: {
    id: number
    sort_order: number
    name: string
    max_score: number
    description: string
    sub_categories: any[]
  }
  /** 管理模式下显示题目增删改按钮 */
  showManage?: boolean
  /** 题目变化时回调（增删改后刷新） */
  onQuestionChange?: () => void
}

export default function MajorSection({ major, showManage, onQuestionChange }: Props) {
  const answers = useAssessmentStore.getState().answers

  // 计算大类总得分（遍历所有子类和细项）
  let score = 0
  major.sub_categories.forEach(sub => {
    sub.sub_sub_categories.forEach((ss: any) => {
      ss.questions.forEach((q: any) => {
        score += answers[q.id]?.score ?? 0
      })
    })
  })

  // 根据得分率确定徽章颜色
  const pct = major.max_score > 0 ? Math.round(score / major.max_score * 100) : 0
  const color = pct >= 60 ? 'bg-green-100 text-green-800' : pct >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'

  return (
    <div>
      <CollapsePanel
        title={major.name}
        badge={`${score.toFixed(2)} / ${major.max_score}`}
        badgeColor={color}
        defaultOpen={true}
      >
        <div className="p-4">
          {/* 整体备注区域（小组讨论时记录整体要点） */}
          <div className="mb-4 bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              整体备注（小组讨论记录）
            </label>
            <InterviewNotes majorId={major.id} />
          </div>

          {/* 方面描述说明 */}
          {major.description && (
            <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded">{major.description}</p>
          )}

          {/* 渲染所有子类（透传管理标志和回调） */}
          <div className="space-y-3">
            {major.sub_categories.map(sub => (
              <SubSection
                key={sub.id}
                subCategory={sub}
                showManage={showManage}
                onQuestionChange={onQuestionChange}
              />
            ))}
          </div>
        </div>
      </CollapsePanel>
    </div>
  )
}
