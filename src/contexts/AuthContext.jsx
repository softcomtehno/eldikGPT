import { createContext, useContext, useState, useEffect } from 'react'
import { getProfile, isAuthenticated, logout as apiLogout } from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      if (isAuthenticated()) {
        const profile = await getProfile()
        setUser(profile)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      apiLogout()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (userData) => {
    try {
      const profile = await getProfile()
      setUser(profile)
    } catch (error) {
      console.error('Error loading profile:', error)
      setUser(userData)
    }
  }

  const logout = () => {
    apiLogout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}
