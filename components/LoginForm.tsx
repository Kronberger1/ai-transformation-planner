'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'reset'>('login')
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    console.log('Login result - error:', error)
    console.log('Login result - session check starting')
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      window.location.href = '/dashboard'
    }
    const { data: sessionData } = await supabase.auth.getSession()
    console.log('Session after login:', JSON.stringify(sessionData))
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    if (error) {
      setError(error.message)
    } else {
      setResetSent(true)
    }
    setLoading(false)
  }

  if (resetSent) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-xl text-center">
        <p className="text-green-600 font-medium">Password reset email sent!</p>
        <p className="mt-2 text-sm text-gray-500">Check your inbox for the reset link.</p>
        <button
          onClick={() => { setMode('login'); setResetSent(false) }}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Back to login
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-8 shadow-xl">
      {mode === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <button
            type="button"
            onClick={() => { setMode('reset'); setError(null) }}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
          >
            Forgot password?
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <p className="text-sm text-gray-600">Enter your email to receive a password reset link.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null) }}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
          >
            Back to login
          </button>
        </form>
      )}
    </div>
  )
}
