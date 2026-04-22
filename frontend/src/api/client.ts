/**
 * ============================================================================
 * Axios 客户端配置
 * ============================================================================
 * 说明：
 *   创建全局 Axios 实例，baseURL 指向 /api。
 *   Vite 开发服务器配置中将 /api 代理到后端 localhost:8000。
 * ============================================================================
 */
import axios from 'axios'

// 创建 Axios 实例
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

export default client
