/**
 * ============================================================================
 * 大类备注组件 (InterviewNotes)
 * ============================================================================
 * 功能：
 *   渲染一个文本框，用于记录每个大类（方面）的整体备注。
 *   在用户输入后自动保存（1秒防抖），无需手动操作。
 *
 * 自动保存机制：
 *   1. 用户输入内容 → 本地状态立即更新
 *   2. 等待1秒无新输入 → 发送API保存到后端
 *   3. 保存成功后显示"已保存"提示
 *   4. 新输入会重置定时器
 * ============================================================================
 */
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

interface Props {
  /** 所属大类（方面）的ID */
  majorId: number
}

export default function InterviewNotes({ majorId }: Props) {
  const { id } = useParams()
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)

  // 组件加载时，获取已有的备注内容
  useEffect(() => {
    const projectId = parseInt(id!)
    axios.get(`/api/projects/${projectId}/notes/${majorId}`)
      .then(r => setContent(r.data.content || ''))
      .catch(() => {})
  }, [majorId, id])

  /**
   * 处理文本变化（带防抖自动保存）
   * @param value - 新的文本内容
   */
  const handleChange = (value: string) => {
    setContent(value)
    setSaved(false)
    // 清除之前的定时器，实现防抖（停止输入1秒后保存）
    clearTimeout((window as any)._noteTimer)
    ;(window as any)._noteTimer = setTimeout(() => {
      const projectId = parseInt(id!)
      axios.put(`/api/projects/${projectId}/notes/${majorId}`, { content: value })
        .then(() => setSaved(true))
        .catch(() => {})
    }, 1000)
  }

  return (
    <div>
      <textarea
        value={content}
        onChange={e => handleChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-24 resize-none"
        placeholder="在此记录小组讨论要点，与本大类相关的整体情况..."
      />
      {saved && <span className="text-xs text-green-600 mt-1">已保存</span>}
    </div>
  )
}
