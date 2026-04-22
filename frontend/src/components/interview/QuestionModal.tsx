/**
 * ============================================================================
 * 题目编辑弹窗组件 (QuestionModal)
 * ============================================================================
 * 功能：
 *   以弹窗形式新增或修改题目，包含：
 *   - 题目基本信息（标题、排序、满分、行业类型）
 *   - A-F 六个等级选项（等级、分值、描述、建议等级）
 *
 * 使用方式：
 *   <QuestionModal
 *     open={showModal}
 *     onClose={() => setShowModal(false)}
 *     onSave={(data) => createQuestion(data)}
 *     mode="create"
 *     subSubCategoryId={ss.id}
 *   />
 * ============================================================================
 */
import { useState, useEffect } from 'react'
import { listDepartments } from '../../api/questions'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: {
    sub_sub_category_id: number
    sort_order: number
    title: string
    max_score: number
    industry_type: string
    responsible_dept: string
    options: { level: string; score: number; description: string; target_level: string }[]
  }) => Promise<void>
  mode: 'create' | 'edit'
  subSubCategoryId: number
  /** 编辑时的初始数据 */
  initialData?: {
    id: number
    sort_order: number
    title: string
    max_score: number
    industry_type: string
    responsible_dept: string
    options: { level: string; score: number; description: string; target_level: string }[]
  }
}

const LEVELS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function QuestionModal({ open, onClose, onSave, mode, subSubCategoryId, initialData }: Props) {
  const [title, setTitle] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [maxScore, setMaxScore] = useState(0)
  const [industryType, setIndustryType] = useState('通用')
  const [responsibleDept, setResponsibleDept] = useState('')
  const [departments, setDepartments] = useState<string[]>([])
  const [options, setOptions] = useState<{ level: string; score: number; description: string; target_level: string }[]>([])
  const [saving, setSaving] = useState(false)

  // 加载已有部门列表
  useEffect(() => {
    listDepartments().then(r => setDepartments(r.data.departments))
  }, [])

  // 当弹窗打开或初始数据变化时，填充表单
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        setTitle(initialData.title)
        setSortOrder(initialData.sort_order)
        setMaxScore(initialData.max_score)
        setIndustryType(initialData.industry_type || '通用')
        setResponsibleDept(initialData.responsible_dept || '')
        setOptions(initialData.options.length > 0 ? initialData.options : LEVELS.map(l => ({
          level: l, score: 0, description: '', target_level: '',
        })))
      } else {
        setTitle('')
        setSortOrder(0)
        setMaxScore(0)
        setIndustryType('通用')
        setResponsibleDept('')
        setOptions(LEVELS.map(l => ({ level: l, score: 0, description: '', target_level: '' })))
      }
    }
  }, [open, mode, initialData])

  /** 更新单个等级选项的某个字段 */
  const updateOption = (index: number, field: string, value: string | number) => {
    setOptions(prev => prev.map((opt, i) =>
      i === index ? { ...opt, [field]: value } : opt
    ))
  }

  /** 保存 */
  const handleSave = async () => {
    if (!title.trim()) {
      alert('请输入题目名称')
      return
    }
    setSaving(true)
    try {
      await onSave({
        sub_sub_category_id: subSubCategoryId,
        sort_order: sortOrder,
        title: title.trim(),
        max_score: maxScore,
        industry_type: industryType,
        responsible_dept: responsibleDept,
        options,
      })
      onClose()
    } catch (e: any) {
      alert(e.message || '保存失败')
    }
    setSaving(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
        onClick={e => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-xl z-10">
          <h3 className="text-lg font-bold">
            {mode === 'create' ? '新增题目' : '编辑题目'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            &times;
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* 基本信息 */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">题目名称 *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="请输入题目名称"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">满分</label>
                <input
                  type="number"
                  step="0.25"
                  value={maxScore}
                  onChange={e => setMaxScore(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">行业类型</label>
                <select
                  value={industryType}
                  onChange={e => setIndustryType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="通用">通用</option>
                  <option value="离散">离散</option>
                  <option value="流程">流程</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">责任部门</label>
              <select
                value={responsibleDept}
                onChange={e => setResponsibleDept(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">（未分配）</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input
                value={responsibleDept}
                onChange={e => setResponsibleDept(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1.5"
                placeholder="或手动输入部门名称..."
              />
            </div>
          </div>

          {/* 等级选项 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">等级选项（A-F）</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={opt.level} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      i === 0 ? 'bg-gray-800 text-white' :
                      i === 1 ? 'bg-blue-600 text-white' :
                      i === 2 ? 'bg-green-600 text-white' :
                      i === 3 ? 'bg-yellow-500 text-white' :
                      i === 4 ? 'bg-orange-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {opt.level}
                    </span>
                    <input
                      type="number"
                      step="0.25"
                      value={opt.score}
                      onChange={e => updateOption(i, 'score', parseFloat(e.target.value) || 0)}
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="分值"
                    />
                    <span className="text-xs text-gray-500">分</span>
                  </div>
                  <input
                    value={opt.description}
                    onChange={e => updateOption(i, 'description', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm mb-1.5"
                    placeholder="等级描述"
                  />
                  <input
                    value={opt.target_level}
                    onChange={e => updateOption(i, 'target_level', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    placeholder="建议等级（如：B）"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3 rounded-b-xl">
          <button
            onClick={onClose}
            className="border border-gray-300 px-5 py-2 rounded-lg hover:bg-gray-50 text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {saving ? '保存中...' : (mode === 'create' ? '创建' : '保存')}
          </button>
        </div>
      </div>
    </div>
  )
}
