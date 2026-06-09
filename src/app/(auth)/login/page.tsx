'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export default function LoginPage() {
  const router = useRouter()
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  // Initialize Supabase client on mount (client-side only)
  useEffect(() => {
    setSupabase(getSupabase())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      setError('Supabase is not configured. Check your environment variables.')
      return
    }
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (signUpError) throw signUpError
        setError('Check your email for the confirmation link.')
        setLoading(false)
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError

      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Content<span className="text-brand-accent">Studio</span>
          </h1>
          <p className="text-brand-muted text-sm mt-2">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-brand-dark border border-brand-border text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-accent transition-colors"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="w-full px-4 py-3 rounded-xl bg-brand-dark border border-brand-border text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-accent transition-colors"
                placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
              />
            </div>

            {/* Error / Success */}
            {error && (
              <div className={`px-4 py-3 rounded-xl text-sm ${
                error.includes('Check your email')
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !supabase}
              className="w-full py-3.5 rounded-xl font-semibold text-sm bg-brand-accent text-brand-dark hover:bg-brand-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading
                ? 'Please wait...'
                : !supabase
                  ? 'Loading...'
                  : mode === 'login'
                    ? 'Sign In'
                    : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-brand-border" />
            <span className="text-xs text-brand-muted">
              {mode === 'login' ? 'New here?' : 'Already have an account?'}
            </span>
            <div className="flex-1 h-px bg-brand-border" />
          </div>

          {/* Toggle mode */}
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError(null)
            }}
            className="w-full py-3.5 rounded-xl font-semibold text-sm border border-brand-border text-brand-text hover:border-brand-accent transition-all active:scale-[0.98]"
          >
            {mode === 'login' ? 'Create new account' : 'Sign in instead'}
          </button>
        </div>

        {/* Back to home */}
        <p className="text-center text-brand-muted text-xs mt-6">
          <Link href="/" className="text-brand-accent hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
