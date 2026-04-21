/**
 * ============================================================================
 * Vite 配置文件
 * ============================================================================
 * 说明：
 *   - 使用 React 插件支持 JSX/TSX
 *   - 开发服务器端口: 3000
 *   - API 代理: /api和 /uploads 转发到后端 8000 端口
 *
 * 代理机制：
 *   前端所有 /api/xxx 请求自动代理到 http://localhost:8000/api/xxx
 *   这样前端代码不需要知道后端的实际地址
 * ============================================================================
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,  // 前端开发服务器端口
    proxy: {
      // 代理 API 请求到后端
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // 代理静态文件（上传附件）到后端
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
