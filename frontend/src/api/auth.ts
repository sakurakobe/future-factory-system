import client, { setToken, clearToken, getToken } from './client'

export const login = (password: string) =>
  client.post<{ token: string }>('/auth/login', { password })

export const changePassword = (old: string, newPwd: string) =>
  client.post('/auth/change-password', { old, new: newPwd })

export const isLoggedIn = () => !!getToken()
export { clearToken }
