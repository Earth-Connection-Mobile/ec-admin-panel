import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const initDone = useRef(false)

  const checkAdminRole = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('role, status')
        .eq('id', userId)
        .single()

      if (error || !data) return false
      return data.role === 'admin' && data.status === 'active'
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    if (initDone.current) return
    initDone.current = true

    const init = async () => {
      // Check for SSO token
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')

      if (token) {
        window.history.replaceState({}, '', window.location.pathname)
        try {
          const { data } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: token,
          })
          if (data?.session) {
            const admin = await checkAdminRole(data.session.user.id)
            if (admin) {
              setSession(data.session)
              setUser(data.session.user)
              setIsAdmin(true)
            }
          }
        } catch { /* fall through */ }
        setIsLoading(false)
        return
      }

      // Check existing session
      const { data: { session: existing } } = await supabase.auth.getSession()
      if (existing?.user) {
        const admin = await checkAdminRole(existing.user.id)
        if (admin) {
          setSession(existing)
          setUser(existing.user)
          setIsAdmin(true)
        }
      }
      setIsLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        // Only handle sign-out events here — sign-in is handled by signIn()
        if (!newSession) {
          setSession(null)
          setUser(null)
          setIsAdmin(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [checkAdminRole])

  const signIn = useCallback(async (email, password) => {
    setIsLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setIsLoading(false)
      return { error: error.message }
    }

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
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
