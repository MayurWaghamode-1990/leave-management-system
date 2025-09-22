import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@/types'
import api, { endpoints } from '@/config/api'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user && !!localStorage.getItem('token')

  // Check authentication status on app load
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (!token) {
        setIsLoading(false)
        return
      }

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
        } catch (error) {
          localStorage.removeItem('user')
        }
      }

      // Validate token with server
      const response = await api.get(endpoints.auth.profile)
      if (response.data.success) {
        const userData = response.data.data
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
      }
    } catch (error) {
      // Token is invalid, clear local storage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await api.post(endpoints.auth.login, {
        email,
        password,
      })

      if (response.data.success) {
        const { token, user: userData } = response.data.data

        // Store token and user data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(userData))

        setUser(userData)
        toast.success('Login successful!')
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Login failed'
      toast.error(message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    try {
      // Call logout endpoint (optional - for logging purposes)
      api.post(endpoints.auth.logout).catch(() => {
        // Ignore errors on logout endpoint
      })
    } catch (error) {
      // Ignore errors
    } finally {
      // Clear local storage and state
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
      toast.success('Logged out successfully')

      // Redirect to login
      window.location.href = '/login'
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    checkAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}