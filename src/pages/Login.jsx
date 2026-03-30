import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { isAdmin, isLoading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Already authenticated admin — redirect to dashboard
  if (!isLoading && isAdmin) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const result = await signIn(email, password)
    if (result.error) {
      setError(result.error)
      setSubmitting(false)
    }
    // On success, the auth state change will trigger a re-render and redirect above
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ec-bg px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-xl border border-ec-card-border bg-ec-card px-8 py-10 shadow-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            {/* Logo icon */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ec-gold/10">
              <svg className="h-8 w-8 text-ec-gold" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <h1 className="font-heading text-3xl font-bold text-ec-text">
              Earth Connection
            </h1>
            <p className="mt-1 font-body text-sm text-ec-text-secondary">
              Admin Portal
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg border border-ec-rust/20 bg-ec-rust/5 px-4 py-3 text-sm text-ec-rust font-body">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[13px] font-medium text-ec-text font-body"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@earthconnection.org"
                className="w-full rounded-lg border border-ec-card-border bg-ec-card px-3 py-2.5 text-sm text-ec-text font-body placeholder:text-ec-text-secondary/50 transition-shadow"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-[13px] font-medium text-ec-text font-body"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-ec-card-border bg-ec-card px-3 py-2.5 text-sm text-ec-text font-body placeholder:text-ec-text-secondary/50 transition-shadow"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="flex w-full items-center justify-center rounded-lg bg-ec-gold px-4 py-2.5 text-sm font-medium text-ec-nav-bg font-body hover:bg-ec-gold-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-ec-nav-bg/30 border-t-ec-nav-bg"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer text */}
        <p className="mt-6 text-center text-xs text-ec-text-secondary/60 font-body">
          Admin access only. Contact your administrator for access.
        </p>
      </div>
    </div>
  )
}
