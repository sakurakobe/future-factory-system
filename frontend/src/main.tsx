/**
 * ============================================================================
 * 前端入口文件
 * ============================================================================
 * 说明：
 *   React 应用的入口点，使用 BrowserRouter 提供路由支持。
 *   所有页面组件通过 App.tsx 中的路由配置进行渲染。
 * ============================================================================
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* BrowserRouter 启用 HTML5 History API 路由 */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
