/**
 * ============================================================================
 * 项目列表页面 (ProjectListPage)
 * ============================================================================
 * 功能：
 *   - 显示所有评估项目列表
 *   - 支持新建项目和删除项目
 *   - 每个项目显示企业名称、类型、日期、状态
 *
 * 路由：/
 * ============================================================================
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listProjects, deleteProject } from '../api/projects'
import type { Project } from '../types/project'

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const navigate = useNavigate()

  // 页面加载时获取项目列表
  useEffect(() => {
    loadProjects()
  }, [])

  /** 加载项目列表 */
  const loadProjects = async () => {
    const res = await listProjects()
    setProjects(res.data)
  }

  /** 删除项目（需确认） */
  const handleDelete = async (id: number) => {
    if (confirm('确定删除该项目？')) {
      await deleteProject(id)
      loadProjects()
    }
  }

  return (
    <div>
      {/* 页面标题 + 新建按钮 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">评估项目列表</h2>
        <button
          onClick={() => navigate('/project/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + 新建项目
        </button>
      </div>

      {/* 项目列表 */}
      {projects.length === 0 ? (
        /* 空状态：暂无项目 */
        <div className="text-center py-20 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg mb-4">暂无评估项目</p>
          <button
            onClick={() => navigate('/project/new')}
            className="text-blue-600 hover:underline"
          >
            创建第一个项目 →
          </button>
        </div>
      ) : (
        /* 项目卡片列表 */
        <div className="grid gap-4">
          {projects.map(p => (
            <div key={p.id} className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{p.company_name}</h3>
                <p className="text-gray-500 text-sm mt-1">
                  {p.company_type} | {p.assessment_start_date || '未设置日期'} ~ {p.assessment_end_date || '未设置日期'}
                </p>
                <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                  p.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {p.status === 'completed' ? '已完成' : '进行中'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/project/${p.id}`)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  进入
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-red-600 hover:text-red-800 px-2"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
