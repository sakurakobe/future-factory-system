/**
 * ============================================================================
 * 题目卡片组件 (QuestionCard)
 * ============================================================================
 * 功能：
 *   渲染单个评估题目的完整卡片，包含：
 *   - 题目文字
 *   - 得分徽章
 *   - 所有A-F等级选项（全部展开显示）
 *   - 等级选择器（A-F按钮组）
 *   - 企业现状文本框
 *   - 沟通内容文本框
 *   - 目标等级选择器
 *   - 管理按钮（编辑/删除，仅在管理模式下显示）
 *
 * 交互：
 *   - 选择等级后自动保存
 *   - 所有修改实时反映到得分汇总
 *   - 点击编辑/删除按钮可管理题目（需传入 onManage 回调）
 * ============================================================================
 */
import { useAssessmentStore } from '../../store/assessmentStore'
import { useParams } from 'react-router-dom'
import LevelSelector from '../common/LevelSelector'
import ScoreBadge from '../common/ScoreBadge'
import QuestionModal from './QuestionModal'
import { useState } from 'react'

interface Props {
  question: {
    id: number
    sort_order?: number
    title: string
    max_score: number
    options: { level: string; score: number; description: string }[]
  }
  /** 管理模式下显示编辑/删除按钮 */
  showManage?: boolean
  /** 题目变化时回调（增删改后刷新） */
  onQuestionChange?: () => void
}

export default function QuestionCard({ question, showManage, onQuestionChange }: Props) {
  const { id } = useParams()
  const projectId = parseInt(id!)
  const answers = useAssessmentStore.getState().answers
  const answer = answers[question.id]
  const selectedLevel = answer?.selected_level
  const score = answer?.score ?? 0

  // 编辑弹窗状态
  const [editOpen, setEditOpen] = useState(false)

  /** 删除题目 */
  const handleDelete = async () => {
    if (!confirm(`确定删除题目「${question.title}」？\n关联的回答数据也将被删除。`)) return
    try {
      const { deleteQuestion } = await import('../../api/questions')
      await deleteQuestion(question.id)
      onQuestionChange?.()
    } catch (e: any) {
      alert(e.message || '删除失败')
    }
  }

  return (
    <>
      <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition">
        {/* 题目行：左侧题目文字 + 右侧得分徽章 + 管理按钮 */}
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-medium text-gray-900 flex-1">
            {question.sort_order ? `${question.sort_order}. ` : ''}{question.title}
          </h4>
          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
            {/* 管理按钮（编辑/删除） */}
            {showManage && (
              <div className="flex gap-1">
                <button
                  onClick={() => setEditOpen(true)}
                  className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                  title="编辑题目"
                >
                  编辑
                </button>
                <button
                  onClick={handleDelete}
                  className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 transition"
                  title="删除题目"
                >
                  删除
                </button>
              </div>
            )}
            <ScoreBadge score={score} maxScore={question.max_score} size="sm" />
          </div>
        </div>

        {/* 所有等级选项（全部展开显示，方便对比选择） */}
        <div className="mb-3">
          <label className="block text-sm text-gray-600 mb-1">沟通等级</label>
          <LevelSelector
            options={question.options}
            value={selectedLevel}
            onChange={(level) => {
              useAssessmentStore.getState().setAnswer(projectId, question.id, {
                selected_level: level,
              })
            }}
          />
          {/* 所有A-F等级的描述（全部展开，方便对比参考） */}
          <div className="mt-2 space-y-1.5">
            {question.options.map(opt => (
              <div
                key={opt.level}
                className={`text-sm p-2 rounded-lg border transition ${
                  opt.level === selectedLevel
                    ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <span className={`font-semibold ${
                  opt.level === selectedLevel ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {opt.level}级 ({opt.score}分)
                </span>
                <span className="ml-2 text-gray-600">{opt.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 企业现状 + 沟通内容（双列布局） */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">企业现状</label>
            <textarea
              value={answer?.company_status || ''}
              onChange={(e) => {
                useAssessmentStore.getState().setAnswer(projectId, question.id, {
                  company_status: e.target.value,
                })
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-20 resize-none"
              placeholder="描述企业当前情况..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">沟通内容</label>
            <textarea
              value={answer?.communication_content || ''}
              onChange={(e) => {
                useAssessmentStore.getState().setAnswer(projectId, question.id, {
                  communication_content: e.target.value,
                })
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-20 resize-none"
              placeholder="沟通要点..."
            />
          </div>
        </div>

        {/* 目标等级选择 */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">目标等级</label>
          <LevelSelector
            options={question.options}
            value={answer?.target_level || null}
            onChange={(level) => {
              useAssessmentStore.getState().setAnswer(projectId, question.id, {
                target_level: level,
              })
            }}
          />
        </div>
      </div>

      {/* 编辑弹窗 */}
      <QuestionModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={async (data) => {
          const { updateQuestion } = await import('../../api/questions')
          await updateQuestion(question.id, {
            title: data.title,
            sort_order: data.sort_order,
            max_score: data.max_score,
            industry_type: data.industry_type,
            options: data.options,
          })
          onQuestionChange?.()
        }}
        mode="edit"
        subSubCategoryId={0}
        initialData={{
          id: question.id,
          sort_order: question.sort_order || 0,
          title: question.title,
          max_score: question.max_score,
          industry_type: '通用',
          options: question.options.map(o => ({
            level: o.level,
            score: o.score,
            description: o.description || '',
            target_level: '',
          })),
        }}
      />
    </>
  )
}
