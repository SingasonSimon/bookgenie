import React, { createContext, useState, useEffect, useContext } from 'react'
import { BookGenieAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const api = new BookGenieAPI()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('bookgenie_token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const userData = await api.verifyAuth(token)
      if (userData) {
        setUser(userData)
      } else {
        localStorage.removeItem('bookgenie_token')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('bookgenie_token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const result = await api.login(email, password)
      if (result.success && result.token) {
        localStorage.setItem('bookgenie_token', result.token)
        setUser(result.user)
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Login failed' }
      }
    } catch (error) {
      // Extract error message from the error object
      const errorMessage = error.data?.error || error.message || 'Login failed. Please check your credentials.'
      return { success: false, error: errorMessage }
    }
  }

  const register = async (formData) => {
    try {
      const result = await api.register(formData)
      if (result.success && result.token) {
        localStorage.setItem('bookgenie_token', result.token)
        setUser(result.user)
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Registration failed' }
      }
    } catch (error) {
      // Extract error message from the error object
      const errorMessage = error.data?.error || error.message || 'Registration failed. Please try again.'
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    localStorage.removeItem('bookgenie_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

