/**
 * ============================================================================
 * 子类区域组件 (SubSection)
 * ============================================================================
 * 功能：
 *   渲染一个子类（如"技术支撑"）的区域。
 *   包含子类描述和所有细项（SubSubSection）。
 *
 * 层级：方面(MajorSection) → 子类(SubSection) → 细项(SubSubSection) → 题目(QuestionCard)
 * ============================================================================
 */
import { useAssessmentStore } from '../../store/assessmentStore'
import SubSubSection from './SubSubSection'
import CollapsePanel from '../common/CollapsePanel'

interface Props {
  subCategory: {
    id: number
    name: string
    max_score: number
    description: string
    sub_sub_categories: any[]
  }
  /** 管理模式下显示题目增删改按钮 */
  showManage?: boolean
  /** 题目变化时回调（增删改后刷新） */
  onQuestionChange?: () => void
}

export default function SubSection({ subCategory, showManage, onQuestionChange }: Props) {
  const answers = useAssessmentStore.getState().answers

  // 计算子类总得分
  let score = 0
  subCategory.sub_sub_categories.forEach(ss => {
    ss.questions.forEach((q: any) => {
      score += answers[q.id]?.score ?? 0
    })
  })

  return (
    <div className="ml-6">
      <CollapsePanel
        title={subCategory.name}
        badge={`${score.toFixed(2)} / ${subCategory.max_score}`}
        badgeColor="bg-purple-100 text-purple-800"
      >
        <div className="p-4">
          {/* 子类描述说明 */}
          {subCategory.description && (
            <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded">{subCategory.description}</p>
          )}
          {/* 渲染所有细项（透传管理标志和回调） */}
          <div className="space-y-3">
            {subCategory.sub_sub_categories.map(ss => (
              <SubSubSection
                key={ss.id}
                subSubCategory={ss}
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
