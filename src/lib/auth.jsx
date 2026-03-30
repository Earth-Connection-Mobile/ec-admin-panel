import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const checkAdminRole = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('members')
      .select('role, status')
      .eq('id', userId)
      .single()

    if (error || !data) return false
    return data.role === 'admin' && data.status === 'active'
  }, [])

  const handleSession = useCallback(async (newSession) => {
    if (!newSession?.user) {
      setSession(null)
      setUser(null)
      setIsAdmin(false)
      setIsLoading(false)
      return
    }

    setSession(newSession)
    setUser(newSession.user)

    const admin = await checkAdminRole(newSession.user.id)
    setIsAdmin(admin)

    if (!admin) {
      // Sign out non-admin users
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)
      setIsAdmin(false)
    }

    setIsLoading(false)
  }, [checkAdminRole])

  useEffect(() => {
    // Check for SSO token from URL parameter (mobile app handoff)
    const handleSSOToken = async () => {
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')

      if (token) {
        // Strip token from URL to avoid leaking in browser history
        window.history.replaceState({}, '', window.location.pathname)

        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: token,
          })
          if (!error && data?.session) {
            await handleSession(data.session)
            return true
          }
        } catch {
          // Fall through to normal session check
        }
      }
      return false
    }

    const init = async () => {
      const ssoHandled = await handleSSOToken()
      if (ssoHandled) return

      const { data: { session: existingSession } } = await supabase.auth.getSession()
      await handleSession(existingSession)
    }

    init()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        await handleSession(newSession)
      }
    )

    return () => subscription.unsubscribe()
  }, [handleSession])

  const signIn = useCallback(async (email, password) => {
    setIsLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setIsLoading(false)
      return { error: error.message }
    }

    // Check admin role
    const admin = await checkAdminRole(data.user.id)
    if (!admin) {
      await supabase.auth.signOut()
      setIsLoading(false)
      return { error: 'Admin access required. This account does not have admin privileges.' }
    }

    setSession(data.session)
    setUser(data.user)
    setIsAdmin(true)
    setIsLoading(false)
    return { error: null }
  }, [checkAdminRole])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setIsAdmin(false)
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
