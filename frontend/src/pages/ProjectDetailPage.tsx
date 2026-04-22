/**
 * ============================================================================
 * 项目详情页面 (ProjectDetailPage)
 * ============================================================================
 * 功能：
 *   项目评估的核心页面，包含 4 个 Tab：
 *   1. 访谈录入（默认）- 三级分类树 + 题目卡片 + 左侧导航栏
 *   2. 补充信息 - 附件上传和文字补充
 *   3. 投资计划 - 改造投资项目管
 *   4. 报告 - 生成并下载 Word/Excel 诊断报告
 *
 * 路由：/project/:id
 *
 * 页面结构（访谈录入Tab）：
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ [← 返回]  项目信息栏  总分: xxx/500 (xx%)                   │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │ Tab: 访谈录入 | 补充信息 | 投资计划 | 报告                    │
 *   ├───────────┬─────────────────────────────────────────────────┤
 *   │ 左侧导航   │  ▼ 1.赋能保障 (得分: 28.92 / 65)              │
 *   │  菜单     │    [整体备注]                                   │
 *   │  (Sidebar)│    ▼ 1.1 技术支撑                             │
 *   │           │      ▼ 1.1.1 新一代信息技术                    │
 *   │           │        Q1. ... [A B C D E F]  2分             │
 *   └───────────┴─────────────────────────────────────────────────┘
 * ============================================================================
 */
import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useAssessmentStore } from '../store/assessmentStore'
import { getProject } from '../api/projects'
import type { Project } from '../types/project'
import MajorSection from '../components/interview/MajorSection'
import ScoreSummary from '../components/interview/ScoreSummary'
import SidebarNav from '../components/interview/SidebarNav'
import FilterBar from '../components/interview/FilterBar'
import StickyScoreBar from '../components/interview/StickyScoreBar'
import { generateReport, downloadReport, downloadExcel } from '../api/reports'

// Tab 定义
const TABS = [
  { key: 'interview', label: '访谈录入' },
  { key: 'supplementary', label: '补充信息' },
  { key: 'investment', label: '投资计划' },
  { key: 'report', label: '报告' },
]

export default function ProjectDetailPage() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'interview'
  const [project, setProject] = useState<Project | null>(null)
  const [generating, setGenerating] = useState(false)
  const [manageMode, setManageMode] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [visibleIds, setVisibleIds] = useState<Set<number> | null>(null)
  const navigate = useNavigate()

  // 从全局 Store 获取状态和操作
  const { categories, answers, loading, error, loadCategories, loadAnswers, clearAnswers } = useAssessmentStore()

  // 页面加载时获取分类树、回答数据和项目信息
  useEffect(() => {
    const projectId = parseInt(id!)
    // 先清空旧数据，避免切换项目时残留
    clearAnswers()
    // 先获取项目信息，然后用 company_type 加载分类树（过滤离散/流程题目）
    getProject(projectId).then(r => {
      const proj = r.data
      setProject(proj)
      // 根据企业类型加载分类树（过滤离散/流程行业题目）
      loadCategories(proj.company_type || '通用')
      loadAnswers(projectId)
    })
  }, [id])

  /** 题目增删改后刷新 */
  const handleQuestionChange = async () => {
    if (!project) return
    // 重新加载分类树和回答数据
    loadCategories(project.company_type || '通用')
    loadAnswers(parseInt(id!))
  }

  /** 生成并下载报告 */
  const handleGenerateReport = async () => {
    setGenerating(true)
    try {
      await generateReport(parseInt(id!))  // 先在后端生成
      await downloadReport(parseInt(id!))  // 再触发下载
    } catch (e) {
      alert('报告生成失败')
    }
    setGenerating(false)
  }

  /** 导出Excel */
  const handleExportExcel = () => {
    downloadExcel(parseInt(id!))
  }

  /** 筛选回调 */
  const handleFilter = useCallback((ids: Set<number>) => {
    setVisibleIds(ids)
  }, [])

  // 加载中状态
  if (loading) return <div className="text-center py-20">加载中...</div>
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部项目信息栏 */}
      {project && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition px-3 py-1.5 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回
              </button>
              <div className="h-6 w-px bg-gray-200" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">{project.company_name}</h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  {project.company_type} · {project.assessment_start_date} ~ {project.assessment_end_date} · 评估人: {project.assessors}
                </p>
              </div>
            </div>
            <ScoreSummary />
          </div>
        </div>
      )}

      {/* Tab 导航栏 */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setSearchParams({ tab: t.key })}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-6">

      {/* Tab 内容区域 */}

      {/* 1. 访谈录入（默认Tab）- 左侧导航 + 右侧题目 */}
      {tab === 'interview' && (
        <div className="flex">
          {/* 左侧导航栏 */}
          <SidebarNav
            categories={categories}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          {/* 右侧题目区域 */}
          <div className="flex-1 space-y-4 pb-16">
            {/* 顶部工具栏 */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                  title={sidebarCollapsed ? '展开导航' : '收起导航'}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <FilterBar categories={categories} onFilter={handleFilter} />
              </div>
              <button
                onClick={() => setManageMode(!manageMode)}
                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition ${
                  manageMode
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {manageMode ? '退出管理模式' : '管理模式'}
              </button>
            </div>

            {categories.map(major => (
              <MajorSection
                key={major.id}
                major={major}
                showManage={manageMode}
                onQuestionChange={handleQuestionChange}
                visibleIds={visibleIds}
              />
            ))}
          </div>
        </div>
      )}

      {/* 悬浮分数栏 */}
      {tab === 'interview' && <StickyScoreBar visibleIds={visibleIds} />}

      {/* 2. 补充信息 */}
      {tab === 'supplementary' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">补充信息</h3>
          <p className="text-gray-500">附件上传和文字补充功能开发中...</p>
        </div>
      )}

      {/* 3. 投资计划 */}
      {tab === 'investment' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">投资建设计划</h3>
          <p className="text-gray-500">投资计划管理功能开发中...</p>
        </div>
      )}

      {/* 4. 报告 */}
      {tab === 'report' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? '生成中...' : '生成并下载 Word 报告'}
            </button>
            <button
              onClick={handleExportExcel}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              导出 Excel 评估结果
            </button>
          </div>
          <div className="border rounded-lg p-8 bg-gray-50">
            <h3 className="text-center text-lg font-semibold text-gray-700 mb-4">
              {project?.company_name}未来工厂建设诊断评估报告
            </h3>
            <div className="space-y-4 text-gray-600">
              <p>点击"生成并下载报告"按钮生成DOCX格式诊断报告。</p>
              <p>点击"导出Excel评估结果"按钮生成XLSX格式评估明细表。</p>
              <p>报告将包含：概述、各项细项分析、改造投入建议等完整内容。</p>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
