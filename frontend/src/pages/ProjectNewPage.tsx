/**
 * ============================================================================
 * 新建项目页面 (ProjectNewPage)
 * ============================================================================
 * 功能：
 *   创建新的评估项目，填写企业基本信息后进入评估页面。
 *
 * 路由：/project/new
 *
 * 表单字段：
 *   - 企业名称（必填）
 *   - 企业类型（通用/离散/流程）
 *   - 评估开始日期（可选）
 *   - 评估结束日期（可选）
 *   - 评估人员（可选）
 * ============================================================================
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProject } from '../api/projects'

export default function ProjectNewPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    company_name: '',
    company_type: '通用',
    assessment_start_date: '',
    assessment_end_date: '',
    assessors: '',
  })

  /** 表单提交处理 */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.company_name.trim()) {
      alert('请输入企业名称')
      return
    }
    const res = await createProject(form)
    // 创建成功后跳转到项目详情页
    navigate(`/project/${res.data.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">新建评估项目</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        {/* 企业名称（必填） */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">企业名称 *</label>
          <input
            type="text"
            required
            value={form.company_name}
            onChange={e => setForm({ ...form, company_name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="请输入企业全称"
          />
        </div>

        {/* 企业类型 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">企业类型</label>
          <select
            value={form.company_type}
            onChange={e => setForm({ ...form, company_type: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="通用">通用</option>
            <option value="离散">离散制造</option>
            <option value="流程">流程制造</option>
          </select>
        </div>

        {/* 评估日期（双列布局） */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">评估开始日期</label>
            <input
              type="date"
              value={form.assessment_start_date}
              onChange={e => setForm({ ...form, assessment_start_date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">评估结束日期</label>
            <input
              type="date"
              value={form.assessment_end_date}
              onChange={e => setForm({ ...form, assessment_end_date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* 评估人员 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">评估人员</label>
          <input
            type="text"
            value={form.assessors}
            onChange={e => setForm({ ...form, assessors: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="评估专家名单"
          />
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-3 pt-4">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            创建项目
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
