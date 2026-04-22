/**
 * ============================================================================
 * 大类备注组件 (InterviewNotes)
 * ============================================================================
 */
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

interface Props {
  majorId: number
}

export default function InterviewNotes({ majorId }: Props) {
  const { id } = useParams()
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const projectId = parseInt(id!)
    axios.get(`/api/projects/${projectId}/notes/${majorId}`)
      .then(r => setContent(r.data.content || ''))
      .catch(() => {})
  }, [majorId, id])

  const handleChange = (value: string) => {
    setContent(value)
    setSaved(false)
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
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-20 resize-none bg-white focus:ring-1 focus:ring-blue-300 focus:border-blue-300 outline-none transition"
        placeholder="在此记录小组讨论要点，与本大类相关的整体情况..."
      />
      {saved && <span className="text-xs text-green-600 mt-1 block">已保存</span>}
    </div>
  )
}
