import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { USER_ROLES } from '../utils/constants'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        const userData = session.user
        const role = userData.user_metadata?.role || userData.app_metadata?.role || USER_ROLES.USER
        setUser({ ...userData, role })
        setIsAdmin(role === USER_ROLES.ADMIN)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        const userData = session.user
        const role = userData.user_metadata?.role || userData.app_metadata?.role || USER_ROLES.USER
        setUser({ ...userData, role })
        setIsAdmin(role === USER_ROLES.ADMIN)
      } else {
        setUser(null)
        setIsAdmin(false)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    const role = data.user?.user_metadata?.role || data.user?.app_metadata?.role || USER_ROLES.USER
    if (role !== USER_ROLES.ADMIN) {
      await supabase.auth.signOut()
      throw new Error('Access denied. Admin privileges required.')
    }

    return data
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setSession(null)
    setIsAdmin(false)
  }

  const value = {
    user,
    session,
    loading,
    isAdmin,
    isAuthenticated: !!session,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
