/**
 * ============================================================================
 * 左侧导航栏组件 (SidebarNav)
 * ============================================================================
 * 功能：
 *   在访谈录入页面左侧显示分类导航菜单，支持快速跳转到对应题目。
 *   三级结构：方面 → 子类 → 细项，点击后滚动到对应区域。
 *
 * 使用方式：
 *   <SidebarNav categories={categories} />
 * ============================================================================
 */
import { useState } from 'react'
import type { MajorCategory, SubCategory, SubSubCategory } from '../types/category'

interface Props {
  categories: MajorCategory[]
}

export default function SidebarNav({ categories }: Props) {
  // 记录展开的细项ID（用于滚动目标）
  const [expandedMajor, setExpandedMajor] = useState<number | null>(null)
  const [expandedSub, setExpandedSub] = useState<number | null>(null)

  /** 滚动到目标元素 */
  const scrollTo = (elementId: string) => {
    const el = document.getElementById(elementId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  /** 点击细项：展开层级并滚动到对应位置 */
  const handleNavClick = (majorId: number, subId: number, subSubId: number) => {
    // 确保父级展开
    setExpandedMajor(majorId)
    setExpandedSub(subId)
    setTimeout(() => scrollTo(`question-area-${subSubId}`), 200)
  }

  if (categories.length === 0) return null

  return (
    <nav className="w-56 flex-shrink-0 bg-white rounded-lg shadow p-3 overflow-y-auto max-h-[calc(100vh-180px)] sticky top-20">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">
        题目导航
      </h3>
      {categories.map(major => (
        <div key={major.id} className="mb-1">
          {/* 一级：方面（可展开/收起） */}
          <button
            onClick={() =>
              setExpandedMajor(expandedMajor === major.id ? null : major.id)
            }
            className="w-full text-left text-sm font-bold text-gray-800 px-2 py-1.5 rounded hover:bg-blue-50 transition"
          >
            {major.sort_order ? `${major.sort_order}.` : ''} {major.name}
          </button>
          {expandedMajor === major.id && (
            <div className="ml-3 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
              {major.sub_categories.map(sub => (
                <div key={sub.id}>
                  {/* 二级：子类（可展开/收起） */}
                  <button
                    onClick={() =>
                      setExpandedSub(expandedSub === sub.id ? null : sub.id)
                    }
                    className="w-full text-left text-sm text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition"
                  >
                    {sub.name}
                  </button>
                  {expandedSub === sub.id && (
                    <div className="ml-2 space-y-0.5">
                      {/* 三级：细项（点击跳转） */}
                      {sub.sub_sub_categories.map(ss => (
                        <button
                          key={ss.id}
                          onClick={() => handleNavClick(major.id, sub.id, ss.id)}
                          className="w-full text-left text-xs text-gray-500 px-2 py-1 rounded hover:bg-blue-50 hover:text-blue-700 transition"
                        >
                          {ss.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}
