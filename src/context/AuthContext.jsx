import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, getActiveAccount, saveAccount, switchAccount, getAccounts, canAddAccount, getDeviceId } from '../api/client'
import { reconnectWs } from '../hooks/useWebSocket'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState(getAccounts())

  const clearStoredAccount = useCallback((userId) => {
    const nextAccounts = getAccounts().filter((a) => a.userId !== userId)
    localStorage.setItem('ms_accounts', JSON.stringify(nextAccounts))
    if (localStorage.getItem('ms_active_account') === userId) {
      localStorage.removeItem('ms_active_account')
    }
    setAccounts(nextAccounts)
  }, [])

  const refreshUser = useCallback(async () => {
    const acc = getActiveAccount()
    if (!acc?.token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const { user: u } = await api.me()
      setUser(u)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [clearStoredAccount])

  useEffect(() => { refreshUser() }, [refreshUser])

  const login = async (userId, password) => {
    const result = await api.login({ userId, password, deviceId: getDeviceId() })
    if (result.needsVerification) return result

    const account = { ...result.user, token: result.token }
    saveAccount(account)
    setAccounts(getAccounts())
    setUser(result.user)
    reconnectWs()
    return result
  }

  const register = async (name, userId, password) => {
    if (!canAddAccount()) throw new Error('Максимум 2 аккаунта на устройстве')
    const result = await api.register({ name, userId, password, deviceId: getDeviceId() })
    const account = { ...result.user, token: result.token }
    saveAccount(account)
    setAccounts(getAccounts())
    setUser(result.user)
    reconnectWs()
    return result
  }

  const verifyDevice = async (userId, code) => {
    const result = await api.verifyDevice({ userId, code, deviceId: getDeviceId() })
    const account = { ...result.user, token: result.token }
    saveAccount(account)
    setAccounts(getAccounts())
    setUser(result.user)
    reconnectWs()
    return result
  }

  const googleLogin = async (idToken) => {
    const result = await api.googleAuth({ idToken, deviceId: getDeviceId() })
    const account = { ...result.user, token: result.token }
    saveAccount(account)
    setAccounts(getAccounts())
    setUser(result.user)
    reconnectWs()
    return result
  }

  const logout = () => {
    if (user?.userId) {
      clearStoredAccount(user.userId)
    }
    setUser(null)
    reconnectWs()
  }

  const switchToAccount = (userId) => {
    switchAccount(userId)
    setAccounts(getAccounts())
    refreshUser()
    setTimeout(() => reconnectWs(), 100)
  }

  return (
    <AuthContext.Provider value={{
      user, loading, accounts, login, register, verifyDevice, googleLogin,
      logout, switchToAccount, canAddAccount: canAddAccount(), refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
