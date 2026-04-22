/**
 * ============================================================================
 * 左侧导航栏组件 (SidebarNav)
 * ============================================================================
 * 功能：
 *   在访谈录入页面左侧显示分类导航菜单，支持快速跳转到对应题目。
 *   支持收起/展开，收起后仅显示一个小按钮。
 *
 * 使用方式：
 *   <SidebarNav categories={categories} collapsed={collapsed} onToggle={...} />
 * ============================================================================
 */
import { useState } from 'react'
import { useAssessmentStore } from '../../store/assessmentStore'
import type { MajorCategory } from '../../types/category'

interface Props {
  categories: MajorCategory[]
  collapsed: boolean
  onToggle: () => void
}

export default function SidebarNav({ categories, collapsed, onToggle }: Props) {
  const [expandedMajor, setExpandedMajor] = useState<number | null>(null)
  const answers = useAssessmentStore(s => s.answers)

  /** 滚动到目标元素 */
  const scrollTo = (elementId: string) => {
    const el = document.getElementById(elementId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  /** 点击导航项：展开父级并滚动 */
  const handleNavClick = (majorId: number, subSubId: number) => {
    setExpandedMajor(majorId)
    setTimeout(() => scrollTo(`question-area-${subSubId}`), 200)
  }

  return (
    <>
      {/* 收起/展开按钮 */}
      <button
        onClick={onToggle}
        className="fixed left-0 top-20 z-30 bg-white border border-l-0 rounded-r-lg shadow px-1.5 py-2 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition"
        title={collapsed ? '展开导航' : '收起导航'}
      >
        {collapsed ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        )}
      </button>

      {/* 侧边栏面板 */}
      <nav
        className={`fixed left-0 top-14 z-20 bg-white border-r border-gray-200 overflow-y-auto transition-all duration-300 ease-in-out ${
          collapsed ? '-translate-x-full w-0 opacity-0' : 'translate-x-0 w-56 opacity-100'
        }`}
        style={{ height: 'calc(100vh - 220px)' }}
      >
        <div className="p-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
            题目导航
          </h3>

          {categories.map(major => {
            let majorScore = 0
            let majorMax = 0
            major.sub_categories.forEach((sub: any) => {
              sub.sub_sub_categories.forEach((ss: any) => {
                ss.questions.forEach((q: any) => {
                  majorScore += answers[q.id]?.score ?? 0
                  majorMax += q.max_score
                })
              })
            })
            const isExpanded = expandedMajor === major.id

            return (
              <div key={major.id} className="mb-1">
                {/* 一级：主要方面 */}
                <button
                  onClick={() => setExpandedMajor(isExpanded ? null : major.id)}
                  className={`w-full text-left text-sm font-semibold px-2.5 py-2 rounded-lg transition flex items-center justify-between ${
                    isExpanded
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span>
                    <span className="inline-block w-5 text-gray-400 text-xs">{major.sort_order}</span>
                    {major.name}
                  </span>
                  <span className="text-xs text-gray-500 font-normal">
                    {Math.round(majorScore)}/{majorMax}
                  </span>
                </button>

                {isExpanded && (
                  <div className="mt-1 mb-2 space-y-0.5">
                    {major.sub_categories.map((sub: any) => (
                      <div key={sub.id}>
                        {sub.sub_sub_categories.map((ss: any) => (
                          <button
                            key={ss.id}
                            onClick={() => handleNavClick(major.id, ss.id)}
                            className="w-full text-left text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition flex items-center gap-1"
                          >
                            <span className="w-3 h-3 flex-shrink-0 rounded-full bg-gray-200" />
                            <span className="truncate">{ss.name}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* 占位空间（收起时不占用宽度） */}
      <div className={`flex-shrink-0 transition-all duration-300 ease-in-out ${collapsed ? 'w-0' : 'w-56'}`} />
    </>
  )
}
