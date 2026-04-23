import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { setToken } from '../api/client'

export default function LoginPage({ onLoginSuccess }: { onLoginSuccess?: () => void } = {}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const expired = searchParams.get('reason') === 'expired'

  const handleLogin = async () => {
    if (!password) return
    setLoading(true)
    setError('')
    try {
      const r = await login(password)
      setToken(r.data.token)
      onLoginSuccess?.()
      navigate('/', { replace: true })
    } catch (e: any) {
      setError(e.response?.data?.detail || '登录失败')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H7m14 0h2m-2 0H7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">未来工厂诊断评估系统</h1>
          {expired && (
            <p className="text-sm text-amber-600 mt-2">登录已过期，请重新登录</p>
          )}
        </div>

        {/* Password Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">访问密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="请输入访问密码"
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !password}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition"
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </div>
      </div>
    </div>
  )
}
