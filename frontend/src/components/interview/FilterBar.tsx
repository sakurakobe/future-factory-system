/**
 * ============================================================================
 * 筛选栏组件 (FilterBar)
 * ============================================================================
 * 功能：
 *   支持多选筛选题目：
 *   - 多选能力域（大类）
 *   - 多选细项
 *   - 多选/搜索具体题目
 *   - 按责任部门筛选
 *   筛选项以标签形式显示，点击标签可取消
 * ============================================================================
 */
import { useState, useEffect, useMemo, useRef } from 'react'
import { listDepartments } from '../../api/questions'
import { getFlagged } from '../../utils/flagStore'
import { useAssessmentStore } from '../../store/assessmentStore'
import type { MajorCategory } from '../../types/category'

interface Props {
  categories: MajorCategory[]
  onFilter: (visibleIds: Set<number>) => void
}

export default function FilterBar({ categories, onFilter }: Props) {
  const [departments, setDepartments] = useState<string[]>([])
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(new Set())
  const [selectedMajors, setSelectedMajors] = useState<Set<number>>(new Set())
  const [selectedSubSubs, setSelectedSubSubs] = useState<Set<number>>(new Set())
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set())
  const [showFlagged, setShowFlagged] = useState(false)
  const [showAnswered, setShowAnswered] = useState(false)
  const [showUnanswered, setShowUnanswered] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [expandedMajor, setExpandedMajor] = useState<number | null>(null)
  const [expandedSubSub, setExpandedSubSub] = useState<number | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const majorRef = useRef<HTMLDivElement>(null)
  const subsubRef = useRef<HTMLDivElement>(null)

  // 加载责任部门列表
  useEffect(() => {
    listDepartments().then(r => setDepartments(r.data.departments))
  }, [])

  // 点击外部关闭搜索建议和下拉列表
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSearch(false)
      }
      if (expandedMajor !== null && majorRef.current && !majorRef.current.contains(target)) {
        setExpandedMajor(null)
      }
      if (expandedSubSub !== null && subsubRef.current && !subsubRef.current.contains(target)) {
        setExpandedSubSub(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [expandedMajor, expandedSubSub])

  // 扁平化所有细项
  const allSubSubs = useMemo(() => {
    const list: { id: number; name: string; majorId: number; majorName: string }[] = []
    categories.forEach(major => {
      major.sub_categories.forEach(sub => {
        sub.sub_sub_categories.forEach(ss => {
          list.push({ id: ss.id, name: ss.name, majorId: major.id, majorName: major.name })
        })
      })
    })
    return list
  }, [categories])

  // 所有题目（用于搜索）
  const allQuestions = useMemo(() => {
    const list: { id: number; title: string; subSubId: number; subSubName: string; majorId: number }[] = []
    categories.forEach(major => {
      major.sub_categories.forEach(sub => {
        sub.sub_sub_categories.forEach(ss => {
          ss.questions.forEach(q => {
            list.push({ id: q.id, title: q.title, subSubId: ss.id, subSubName: ss.name, majorId: major.id })
          })
        })
      })
    })
    return list
  }, [categories])

  // 搜索建议
  const searchSuggestions = useMemo(() => {
    if (!keyword.trim()) return []
    return allQuestions.filter(q => q.title.includes(keyword)).slice(0, 10)
  }, [keyword, allQuestions])

  // 计算已答/未答/标记数量
  const stats = useMemo(() => {
    const answers = useAssessmentStore.getState().answers
    const flagged = getFlagged()
    let answered = 0, unanswered = 0, flaggedCount = 0
    for (const q of allQuestions) {
      if (answers[q.id]?.selected_level) answered++
      else unanswered++
      if (flagged.has(q.id)) flaggedCount++
    }
    return { answered, unanswered, flagged: flaggedCount }
  }, [allQuestions])

  // 可见题目计算
  const visibleIds = useMemo(() => {
    const ids = new Set<number>()

    // 确定要看的题目集合（基于细项筛选或全部）
    const relevantSubSubs = selectedSubSubs.size > 0
      ? allSubSubs.filter(s => selectedSubSubs.has(s.id))
      : allSubSubs

    // 确定要看的题目集合（基于题目筛选或细项下的全部）
    let questionIds = new Set<number>()
    if (selectedQuestions.size > 0) {
      questionIds = selectedQuestions
    } else {
      // 基于细项
      for (const subSub of relevantSubSubs) {
        for (const q of allQuestions) {
          if (q.subSubId === subSub.id) {
            questionIds.add(q.id)
          }
        }
      }
    }

    // 部门筛选
    for (const qId of questionIds) {
      const q = allQuestions.find(q => q.id === qId)
      if (!q) continue

      // 大类筛选
      if (selectedMajors.size > 0 && !selectedMajors.has(q.majorId)) continue

      // 部门筛选
      if (selectedDepts.size > 0) {
        // 需要查找题目的部门
        const subSub = allSubSubs.find(s => s.id === q.subSubId)
        if (subSub) {
          // 找到对应的题目查找部门
          const major = categories.find(m => m.id === q.majorId)
          if (major) {
            for (const sub of major.sub_categories) {
              for (const ss of sub.sub_sub_categories) {
                if (ss.id === q.subSubId) {
                  const question = ss.questions.find(qq => qq.id === qId)
                  if (question && selectedDepts.has(question.responsible_dept || '')) {
                    ids.add(qId)
                  }
                }
              }
            }
          }
        }
      } else {
        ids.add(qId)
      }
    }

    return ids
  }, [selectedMajors, selectedSubSubs, selectedQuestions, selectedDepts, allSubSubs, allQuestions, categories])

  // 已标记/已答/未答筛选：在现有筛选基础上再叠加
  const finalVisibleIds = useMemo(() => {
    const ids = visibleIds
    if (!showFlagged && !showAnswered && !showUnanswered) return ids
    const flagged = getFlagged()
    const answers = useAssessmentStore.getState().answers
    const result = new Set<number>()
    for (const id of ids) {
      let keep = true
      if (showFlagged && !flagged.has(id)) keep = false
      if (showAnswered && keep) {
        if (!answers[id]?.selected_level) keep = false
      }
      if (showUnanswered && keep) {
        if (answers[id]?.selected_level) keep = false
      }
      if (keep) result.add(id)
    }
    return result
  }, [visibleIds, showFlagged, showAnswered, showUnanswered])

  // 通知父组件
  useEffect(() => {
    const hasActiveFilter = selectedMajors.size > 0 || selectedSubSubs.size > 0 || selectedQuestions.size > 0 || selectedDepts.size > 0 || showFlagged || showAnswered || showUnanswered
    onFilter(hasActiveFilter ? finalVisibleIds : new Set())
  }, [finalVisibleIds])

  const clearAll = () => {
    setSelectedDepts(new Set())
    setSelectedMajors(new Set())
    setSelectedSubSubs(new Set())
    setSelectedQuestions(new Set())
    setShowFlagged(false)
    setShowAnswered(false)
    setShowUnanswered(false)
    setKeyword('')
  }

  const toggleMajor = (id: number) => {
    const next = new Set(selectedMajors)
    if (next.has(id)) {
      next.delete(id)
      // 同时移除该大类下的细项和题目
      const subSubIds = allSubSubs.filter(s => s.majorId === id).map(s => s.id)
      const qIds = allQuestions.filter(q => q.majorId === id).map(q => q.id)
      for (const ss of subSubIds) next.delete(ss)
      for (const q of qIds) next.delete(q)
      // 也要从对应set中移除
      setSelectedSubSubs(prev => {
        const n = new Set(prev)
        for (const ss of subSubIds) n.delete(ss)
        return n
      })
    } else {
      next.add(id)
    }
    setSelectedMajors(next)
  }

  const toggleSubSub = (id: number) => {
    const next = new Set(selectedSubSubs)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
      // 同时加入该细项所属的大类
      const ss = allSubSubs.find(s => s.id === id)
      if (ss) {
        setSelectedMajors(prev => {
          const n = new Set(prev)
          n.add(ss.majorId)
          return n
        })
      }
    }
    setSelectedSubSubs(next)
  }

  const toggleQuestion = (id: number) => {
    const next = new Set(selectedQuestions)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedQuestions(next)
    setShowSearch(false)
    setKeyword('')
  }

  const hasActiveFilter = selectedMajors.size > 0 || selectedSubSubs.size > 0 || selectedQuestions.size > 0 || selectedDepts.size > 0 || showFlagged || showAnswered || showUnanswered

  // 为每个筛选项生成标签
  const activeTags = useMemo(() => {
    const tags: { label: string; onRemove: () => void }[] = []

    selectedDepts.forEach(d => {
      tags.push({ label: `部门: ${d}`, onRemove: () => { const n = new Set(selectedDepts); n.delete(d); setSelectedDepts(n) } })
    })
    selectedMajors.forEach(id => {
      const major = categories.find(m => m.id === id)
      if (major) tags.push({ label: major.name, onRemove: () => toggleMajor(id) })
    })
    selectedSubSubs.forEach(id => {
      const ss = allSubSubs.find(s => s.id === id)
      if (ss) tags.push({ label: ss.name, onRemove: () => toggleSubSub(id) })
    })
    selectedQuestions.forEach(id => {
      const q = allQuestions.find(q => q.id === id)
      if (q) tags.push({ label: `题: ${q.title.substring(0, 15)}${q.title.length > 15 ? '...' : ''}`, onRemove: () => { const n = new Set(selectedQuestions); n.delete(id); setSelectedQuestions(n) } })
    })
    if (showFlagged) {
      tags.push({ label: `★ 已标记 (${stats.flagged})`, onRemove: () => setShowFlagged(false) })
    }
    if (showAnswered) {
      tags.push({ label: `已答 (${stats.answered})`, onRemove: () => setShowAnswered(false) })
    }
    if (showUnanswered) {
      tags.push({ label: `未答 (${stats.unanswered})`, onRemove: () => setShowUnanswered(false) })
    }

    return tags
  }, [selectedDepts, selectedMajors, selectedSubSubs, selectedQuestions, showFlagged, showAnswered, showUnanswered, stats])

  return (
    <div className="space-y-2">
      {/* 筛选控件行 */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 责任部门 - 多选 */}
        <div className="relative">
          <select
            value=""
            onChange={e => {
              const val = e.target.value
              if (val) {
                const next = new Set(selectedDepts)
                if (next.has(val)) next.delete(val)
                else next.add(val)
                setSelectedDepts(next)
              }
            }}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 outline-none focus:ring-1 focus:ring-blue-300 appearance-none cursor-pointer"
          >
            <option value="">+ 部门</option>
            {departments.map(d => (
              <option key={d} value={d}>部门: {d}</option>
            ))}
          </select>
        </div>

        {/* 大类筛选 - 多选 */}
        <div className="relative">
          <button
            onClick={() => { setExpandedMajor(expandedMajor === 1 ? null : 1); if (expandedSubSub !== null) setExpandedSubSub(null) }}
            onMouseDown={e => e.stopPropagation()}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 outline-none focus:ring-1 focus:ring-blue-300 hover:bg-gray-50 transition"
          >
            能力域 {selectedMajors.size > 0 && <span className="text-blue-500">({selectedMajors.size})</span>}
            <svg className="w-3 h-3 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedMajor === 1 && (
            <div ref={majorRef} className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-2 px-2 min-w-[160px]">
              {categories.map(m => {
                const isSelected = selectedMajors.has(m.id)
                return (
                  <label key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-50 text-xs">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMajor(m.id)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-gray-700">{m.name}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* 细项筛选 - 多选 */}
        <div className="relative">
          <button
            onClick={() => { setExpandedSubSub(expandedSubSub === 1 ? null : 1); if (expandedMajor !== null) setExpandedMajor(null) }}
            onMouseDown={e => e.stopPropagation()}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 outline-none focus:ring-1 focus:ring-blue-300 hover:bg-gray-50 transition"
          >
            细项 {selectedSubSubs.size > 0 && <span className="text-blue-500">({selectedSubSubs.size})</span>}
            <svg className="w-3 h-3 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSubSub === 1 && (
            <div ref={subsubRef} className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-2 px-2 min-w-[200px] max-h-64 overflow-y-auto">
              {allSubSubs.filter(s => !selectedMajors.size || selectedMajors.has(s.majorId)).map(s => {
                const isSelected = selectedSubSubs.has(s.id)
                return (
                  <label key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-50 text-xs">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSubSub(s.id)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-gray-700 truncate">{s.name}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* 题目搜索 - 多选 */}
        <div ref={searchRef} className="relative">
          <input
            type="text"
            value={keyword}
            onChange={e => { setKeyword(e.target.value); setShowSearch(true) }}
            onFocus={() => setShowSearch(true)}
            placeholder="搜索题目加入筛选..."
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 w-40 text-gray-700 outline-none focus:ring-1 focus:ring-blue-300"
          />
          {showSearch && keyword.trim() && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 px-1 min-w-[280px] max-h-56 overflow-y-auto">
              {searchSuggestions.map(s => {
                const isSelected = selectedQuestions.has(s.id)
                return (
                  <label key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-50 text-xs">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleQuestion(s.id)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-gray-700 truncate flex-1">{s.title}</span>
                    <span className="text-gray-400 flex-shrink-0">{s.subSubName}</span>
                  </label>
                )
              })}
              {searchSuggestions.length === 0 && (
                <div className="px-2 py-2 text-gray-400 text-xs text-center">无匹配结果</div>
              )}
            </div>
          )}
        </div>

        {/* 已标记筛选 */}
        <button
          onClick={() => setShowFlagged(!showFlagged)}
          className={`text-xs border rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-amber-300 transition ${
            showFlagged
              ? 'bg-amber-50 border-amber-300 text-amber-700 font-semibold'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          ★ 已标记 ({stats.flagged})
        </button>

        {/* 已答筛选 */}
        <button
          onClick={() => { setShowAnswered(!showAnswered); if (!showAnswered) setShowUnanswered(false) }}
          className={`text-xs border rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-green-300 transition ${
            showAnswered
              ? 'bg-green-50 border-green-300 text-green-700 font-semibold'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          已答 ({stats.answered})
        </button>

        {/* 未答筛选 */}
        <button
          onClick={() => { setShowUnanswered(!showUnanswered); if (!showUnanswered) setShowAnswered(false) }}
          className={`text-xs border rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-gray-300 transition ${
            showUnanswered
              ? 'bg-gray-100 border-gray-400 text-gray-700 font-semibold'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          未答 ({stats.unanswered})
        </button>

        {/* 清除筛选 */}
        {hasActiveFilter && (
          <button
            onClick={clearAll}
            className="text-xs text-gray-400 hover:text-gray-600 transition px-2 py-1 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            清除全部
          </button>
        )}
      </div>

      {/* 已选筛选项标签 */}
      {hasActiveFilter && (
        <div className="flex flex-wrap gap-1.5 pl-0.5">
          {activeTags.map((tag, i) => (
            <span
              key={`${tag.label}-${i}`}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200"
            >
              {tag.label}
              <button
                onClick={tag.onRemove}
                className="hover:text-blue-900 transition ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
