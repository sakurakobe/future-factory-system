/**
 * ============================================================================
 * 折叠面板组件 (CollapsePanel)
 * ============================================================================
 * 功能：
 *   可折叠的面板容器，点击标题栏展开/收起内容区域。
 *   用于构建三级分类的嵌套结构。
 *
 * 特性：
 *   - 左侧有箭头指示器（展开时旋转90度）
 *   - 支持可选的得分徽章显示
 *   - 支持默认展开/收起状态
 * ============================================================================
 */
import { useState, ReactNode } from 'react'

interface Props {
  /** 面板标题文字 */
  title: string
  /** 面板内容（子组件） */
  children: ReactNode
  /** 是否默认展开（默认true） */
  defaultOpen?: boolean
  /** 右侧徽章文字（如"28.92 / 65"） */
  badge?: string
  /** 徽章的 Tailwind 样式类 */
  badgeColor?: string
  /** 右侧额外按钮（如"新增题目"） */
  extra?: ReactNode
}

export default function CollapsePanel({ title, children, defaultOpen = true, badge, badgeColor = 'bg-blue-100 text-blue-800', extra }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* 标题栏：点击切换展开/收起 */}
      <div
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {/* 箭头图标 */}
          <span className={`transform transition-transform ${open ? 'rotate-90' : ''}`}>
            ▶
          </span>
          {/* 标题文字 */}
          <span className="font-medium text-gray-900">{title}</span>
          {/* 得分徽章 */}
          {badge && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        {/* 额外按钮（如新增题目，阻止事件冒泡不触发折叠） */}
        {extra && (
          <span onClick={e => e.stopPropagation()}>{extra}</span>
        )}
      </div>
      {/* 内容区域：仅在展开时渲染 */}
      {open && (
        <div className="border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  )
}
