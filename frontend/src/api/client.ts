/**
 * ============================================================================
 * Axios 客户端配置
 * ============================================================================
 * 说明：
 *   创建全局 Axios 实例，baseURL 指向 /api。
 *   Vite 开发服务器配置中将 /api 代理到后端 localhost:8000。
 *   自动附加认证 token，401 时跳转登录页。
 * ============================================================================
 */
import axios from 'axios'

const TOKEN_KEY = 'auth_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

// 创建 Axios 实例
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

// 请求拦截器：自动附加 token
client.interceptors.request.use(config => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：401 跳转登录
client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      clearToken()
      // Only redirect if not already on login page
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?reason=expired'
      }
    }
    return Promise.reject(err)
  },
)

export default client
