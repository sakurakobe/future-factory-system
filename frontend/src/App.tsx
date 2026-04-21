/**
 * ============================================================================
 * 路由配置 (App.tsx)
 * ============================================================================
 * 说明：
 *   定义前端路由和页面组件的映射关系。
 *   包含全局顶部导航栏和主要内容区域。
 *
 * 路由结构：
 *   /                  → 项目列表页面（ProjectListPage）
 *   /project/new       → 新建项目页面（ProjectNewPage）
 *   /project/:id       → 项目详情页面（ProjectDetailPage）
 * ============================================================================
 */
import { Routes, Route } from 'react-router-dom'
import ProjectListPage from './pages/ProjectListPage'
import ProjectNewPage from './pages/ProjectNewPage'
import ProjectDetailPage from './pages/ProjectDetailPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">未来工厂建设诊断评估系统</h1>
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
        </Routes>
      </main>
    </div>
  )
}

export default App
