/**
 * ============================================================================
 * 细项区域组件 (SubSubSection)
 * ============================================================================
 * 功能：
 *   渲染一个细项（如"新一代信息技术"）的区域。
 *   包含所有题目卡片（QuestionCard）和新增题目按钮。
 *
 * 层级：方面(MajorSection) → 子类(SubSection) → 细项(SubSubSection) → 题目(QuestionCard)
 *
 * 管理功能：
 *   - 在细项标题旁显示"新增题目"按钮
 *   - 支持在弹窗中填写题目信息并创建
 *   创建成功后自动刷新分类树
 * ============================================================================
 */
import { useAssessmentStore } from '../../store/assessmentStore'
import QuestionCard from './QuestionCard'
import CollapsePanel from '../common/CollapsePanel'
import QuestionModal from './QuestionModal'
import { useState } from 'react'

interface Props {
  subSubCategory: {
    id: number
    name: string
    max_score: number
    questions: any[]
  }
  /** 管理模式下显示编辑/删除按钮 */
  showManage?: boolean
  /** 题目变化时回调（增删改后刷新） */
  onQuestionChange?: () => void
}

export default function SubSubSection({ subSubCategory, showManage, onQuestionChange }: Props) {
  const answers = useAssessmentStore.getState().answers
  const [addOpen, setAddOpen] = useState(false)

  // 计算细项总得分
  let score = 0
  subSubCategory.questions.forEach(q => {
    score += answers[q.id]?.score ?? 0
  })

  return (
    <div id={`question-area-${subSubCategory.id}`} className="ml-4">
      <CollapsePanel
        title={subSubCategory.name}
        badge={`${score.toFixed(2)} / ${subSubCategory.max_score}`}
        badgeColor="bg-indigo-100 text-indigo-800"
        extra={
          showManage && (
            <button
              onClick={() => setAddOpen(true)}
              className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition"
              title="在此细项下新增题目"
            >
              + 新增题目
            </button>
          )
        }
      >
        <div className="p-4 space-y-3">
          {/* 渲染所有题目卡片（传入管理标志和回调） */}
          {subSubCategory.questions.map(q => (
            <QuestionCard
              key={q.id}
              question={q}
              showManage={showManage}
              onQuestionChange={onQuestionChange}
            />
          ))}
        </div>
      </CollapsePanel>

      {/* 新增题目弹窗 */}
      <QuestionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={async (data) => {
          const { createQuestion } = await import('../../api/questions')
          await createQuestion(data)
          onQuestionChange?.()
        }}
        mode="create"
        subSubCategoryId={subSubCategory.id}
      />
    </div>
  )
}
