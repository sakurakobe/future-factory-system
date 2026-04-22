/**
 * ============================================================================
 * 题目卡片组件 (QuestionCard)
 * ============================================================================
 * 单选题：单选按钮；多选题：复选框（逗号分隔存储，得分=选中项分值之和）
 *
 * 布局（从上到下）：
 *   1. 标题行：标题 + 得分 + 标记 + 管理按钮
 *   2. 等级描述区（点击可选沟通等级，左侧颜色条标识已答/未答）
 *   3. 沟通等级选择器（A-F 按钮组，与描述区联动）
 *   4. 企业现状 + 沟通内容
 *   5. 目标等级（紫色虚线框，与沟通等级视觉区分）
 * ============================================================================
 */
import { useAssessmentStore } from '../../store/assessmentStore'
import { useParams } from 'react-router-dom'
import LevelSelector from '../common/LevelSelector'
import ScoreBadge from '../common/ScoreBadge'
import QuestionModal from './QuestionModal'
import { useState, useMemo, useEffect } from 'react'
import { getFlagged, toggleFlagged } from '../../utils/flagStore'

interface Props {
  question: {
    id: number
    sort_order?: number
    title: string
    max_score: number
    is_multi_select?: number
    responsible_dept?: string
    options: { level: string; score: number; description: string }[]
  }
  showManage?: boolean
  onQuestionChange?: () => void
}

export default function QuestionCard({ question, showManage, onQuestionChange }: Props) {
  const { id } = useParams()
  const projectId = parseInt(id!)
  const answers = useAssessmentStore(s => s.answers)
  const answer = answers[question.id]
  const score = answer?.score ?? 0
  const selectedLevel = answer?.selected_level
  const isMulti = Boolean(question.is_multi_select)

  const [editOpen, setEditOpen] = useState(false)
  const [flagged, setFlagged] = useState(() => getFlagged().has(question.id))

  // 监听其他题目的标记变化
  useEffect(() => {
    const handler = () => setFlagged(getFlagged().has(question.id))
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [question.id])

  const isAnswered = Boolean(selectedLevel)

  // 多选题：解析选中等级
  const selectedLevels = useMemo(() => {
    if (!selectedLevel) return new Set<string>()
    return new Set(selectedLevel.split(',').map(s => s.trim()).filter(Boolean))
  }, [selectedLevel])

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

  /** 单选题选择 */
  const handleSingleSelect = (level: string) => {
    useAssessmentStore.getState().setAnswer(projectId, question.id, {
      selected_level: level || null,
    })
  }

  /** 多选题切换 */
  const handleMultiToggle = (level: string) => {
    const current = selectedLevels
    const next = new Set(current)
    if (next.has(level)) {
      next.delete(level)
    } else {
      next.add(level)
    }
    const val = next.size > 0 ? Array.from(next).sort().join(',') : null
    useAssessmentStore.getState().setAnswer(projectId, question.id, {
      selected_level: val,
    })
  }

  /** 点击等级描述选中/取消 */
  const handleLevelClick = (level: string) => {
    if (isMulti) {
      handleMultiToggle(level)
    } else {
      handleSingleSelect(selectedLevel === level ? '' : level)
    }
  }

  /** 切换标记 */
  const handleToggleFlag = () => {
    toggleFlagged(question.id)
    setFlagged(getFlagged().has(question.id))
  }

  // 等级颜色映射（用于选中态）
  const levelColors: Record<string, { bgSelected: string; bgSelectedText: string; num: string }> = {
    'A': { bgSelected: 'bg-gray-700', bgSelectedText: 'text-white', num: 'bg-gray-800 text-white' },
    'B': { bgSelected: 'bg-blue-600', bgSelectedText: 'text-white', num: 'bg-blue-600 text-white' },
    'C': { bgSelected: 'bg-green-600', bgSelectedText: 'text-white', num: 'bg-green-600 text-white' },
    'D': { bgSelected: 'bg-yellow-500', bgSelectedText: 'text-white', num: 'bg-yellow-500 text-white' },
    'E': { bgSelected: 'bg-orange-500', bgSelectedText: 'text-white', num: 'bg-orange-500 text-white' },
    'F': { bgSelected: 'bg-red-500', bgSelectedText: 'text-white', num: 'bg-red-500 text-white' },
  }

  return (
    <>
      <div className={`rounded-xl border transition-all relative ${
        flagged
          ? 'bg-amber-50/30 border-amber-200'
          : isAnswered
            ? 'bg-green-50/30 border-green-200'
            : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
      }`}>
        {/* 左侧状态条 */}
        <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${
          flagged
            ? 'bg-amber-400'
            : isAnswered
              ? 'bg-green-400'
              : 'bg-gray-200'
        }`} />

        {/* 题目头部：标题 + 得分 + 标记 + 管理按钮 */}
        <div className="flex items-start justify-between px-4 py-3 pl-5">
          <div className="flex-1 pr-2">
            <h4 className="text-sm font-medium text-gray-900 leading-relaxed flex items-center gap-1.5">
              {question.title}
              {isMulti && (
                <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 font-normal flex-shrink-0">
                  多选
                </span>
              )}
              {question.responsible_dept && (
                <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-normal flex-shrink-0">
                  {question.responsible_dept}
                </span>
              )}
              {/* 已答/未答标识 */}
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                isAnswered
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {isAnswered ? '已答' : '未答'}
              </span>
            </h4>
          </div>
          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
            {/* 标记按钮 */}
            <button
              onClick={handleToggleFlag}
              className={`p-1 rounded transition ${
                flagged
                  ? 'text-amber-500 hover:text-amber-600'
                  : 'text-gray-300 hover:text-amber-400'
              }`}
              title={flagged ? '取消标记' : '添加标记'}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill={flagged ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.518-4.674z" />
              </svg>
            </button>
            {showManage && (
              <div className="flex gap-1">
                <button
                  onClick={() => setEditOpen(true)}
                  className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                >
                  编辑
                </button>
                <button
                  onClick={handleDelete}
                  className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-600 hover:bg-red-100 transition"
                >
                  删除
                </button>
              </div>
            )}
            <ScoreBadge score={score} maxScore={question.max_score} size="sm" />
          </div>
        </div>

        {/* 等级描述区（点击可选等级） */}
        <div className="px-4 pb-2 pl-5">
          <div className="space-y-0.5">
            {question.options.map(opt => {
              const isSelected = isMulti
                ? selectedLevels.has(opt.level)
                : opt.level === selectedLevel
              const colors = levelColors[opt.level] || {
                bgSelected: 'bg-blue-600', bgSelectedText: 'text-white',
                num: 'bg-blue-600 text-white'
              }
              return (
                <div
                  key={opt.level}
                  onClick={() => handleLevelClick(opt.level)}
                  className={`flex items-start gap-2 text-xs py-1 px-2 rounded cursor-pointer transition ${
                    isSelected
                      ? `${colors.bgSelected} ${colors.bgSelectedText}`
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {/* 等级标识 */}
                  <span className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                    isSelected ? colors.num : 'bg-gray-200 text-gray-600'
                  }`}>
                    {opt.level}
                  </span>

                  {/* 等级详情 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">{opt.level}级</span>
                      <span className={`text-[10px] px-1 py-0 rounded ${
                        isSelected ? 'bg-white/30' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {opt.score}分
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed mt-0.5 ${
                      isSelected ? 'opacity-90' : 'text-gray-400'
                    }`}>
                      {opt.description}
                    </p>
                  </div>

                  {/* 选中指示器 */}
                  {isSelected && (
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 沟通等级选择器（与等级描述区联动） */}
        <div className="px-4 pb-3 pl-5">
          <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
            isMulti ? 'bg-purple-50/50 border border-purple-100' : 'bg-blue-50/50 border border-blue-100'
          }`}>
            <span className={`text-xs font-semibold flex-shrink-0 ${
              isMulti ? 'text-purple-600' : 'text-blue-600'
            }`}>
              沟通等级：
            </span>
            {!isMulti ? (
              <LevelSelector
                options={question.options}
                value={selectedLevel}
                onChange={handleSingleSelect}
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {question.options.map(opt => {
                  const checked = selectedLevels.has(opt.level)
                  return (
                    <label
                      key={opt.level}
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer transition ${
                        checked
                          ? 'bg-purple-100 border-purple-300 text-purple-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleMultiToggle(opt.level)}
                        className="h-3 w-3 rounded border-gray-300 text-purple-600"
                      />
                      <span className="font-semibold">{opt.level}</span>
                      <span className="text-gray-400">({opt.score}分)</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* 企业现状 + 沟通内容 */}
        <div className="px-4 pb-3 pl-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">企业现状</label>
              <textarea
                value={answer?.company_status || ''}
                onChange={(e) => {
                  useAssessmentStore.getState().setAnswer(projectId, question.id, {
                    company_status: e.target.value,
                  })
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs h-14 resize-none bg-white focus:ring-1 focus:ring-blue-300 focus:border-blue-300 outline-none transition"
                placeholder="描述企业当前情况..."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">沟通内容</label>
              <textarea
                value={answer?.communication_content || ''}
                onChange={(e) => {
                  useAssessmentStore.getState().setAnswer(projectId, question.id, {
                    communication_content: e.target.value,
                  })
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs h-14 resize-none bg-white focus:ring-1 focus:ring-blue-300 focus:border-blue-300 outline-none transition"
                placeholder="沟通要点..."
              />
            </div>
          </div>
        </div>

        {/* 目标等级（紫色虚线框，与沟通等级视觉区分） */}
        <div className="px-4 pb-3 pl-5">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-violet-50/50 border border-violet-200 border-dashed">
            <span className="text-xs font-semibold text-violet-600 flex-shrink-0">
              目标等级：
            </span>
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
            responsible_dept: data.responsible_dept,
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
          responsible_dept: question.responsible_dept || '',
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
