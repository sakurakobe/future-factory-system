/**
 * ============================================================================
 * 路由配置 (App.tsx)
 * ============================================================================
 * 说明：
 *   定义前端路由和页面组件的映射关系。
 *   包含全局顶部导航栏和主要内容区域。
 *   简单密码保护：未登录时跳转登录页。
 *
 * 路由结构：
 *   /login             → 登录页面
 *   /                  → 项目列表页面（ProjectListPage）
 *   /project/new       → 新建项目页面（ProjectNewPage）
 *   /project/:id       → 项目详情页面（ProjectDetailPage）
 *   /settings          → AI 增强配置页
 * ============================================================================
 */
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useState, useCallback } from 'react'
import ProjectListPage from './pages/ProjectListPage'
import ProjectNewPage from './pages/ProjectNewPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import AISettingsPage from './pages/AISettingsPage'
import LoginPage from './pages/LoginPage'
import { isLoggedIn, clearToken } from './api/auth'

function App() {
  const [authenticated, setAuthenticated] = useState(isLoggedIn())
  const location = useLocation()

  const handleLogout = useCallback(() => {
    clearToken()
    setAuthenticated(false)
  }, [])

  // If not authenticated and not on login page, show login
  if (!authenticated) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">未来工厂建设诊断评估系统</h1>
          <div className="flex items-center gap-1">
            <Link
              to="/settings"
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
              title="AI 增强配置"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
              title="退出登录"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          {/* 项目列表页 */}
          <Route path="/" element={<ProjectListPage />} />
          {/* 新建项目页 */}
          <Route path="/project/new" element={<ProjectNewPage />} />
          {/* 项目详情页（含访谈录入Tab） */}
          <Route path="/project/:id" element={<ProjectDetailPage />} />
          {/* AI 增强配置页 */}
          <Route path="/settings" element={<AISettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
