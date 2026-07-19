'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'

export default function RegisterPage() {
  const supabase = createClient()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.replace('/')
      }
    })
  }, [supabase])

  async function signUpWithPassword() {
    setLoading(true)
    setError(null)
    setMessage(null)

    if (password !== confirmPassword) {
      setLoading(false)
      setError('Passwords do not match.')
      return
    }

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const json = await res.json()

    if (!res.ok) {
      setLoading(false)
      setError(json.error ?? 'Registration failed')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setMessage('Account created. You can now sign in.')
      window.location.assign('/login')
      return
    }

    window.location.assign('/')
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 pt-20">
      <section className="w-full max-w-md space-y-4">
        <div className="rounded-xl border border-white/10 bg-black/50 p-7 backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3">
            <BrandLogo className="h-12 w-12 flex-shrink-0" priority />
            <h1 className="font-display text-2xl font-black">Create your account</h1>
          </div>

          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault()
              await signUpWithPassword()
            }}
          >
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                id="register-name"
                type="text"
                className="pl-9"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                id="register-email"
                type="email"
                required
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                className="pl-9 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 transition-colors hover:text-white"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                id="register-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                className="pl-9 pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 transition-colors hover:text-white"
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error ? (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            {message ? (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                {message}
              </p>
            ) : null}

            <Button id="register-submit" className="w-full" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              )}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#111] px-2 text-white/45 backdrop-blur-sm">Or</span>
              </div>
            </div>

            <Button
              id="register-google"
              className="w-full"
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() =>
                supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: { redirectTo: `${location.origin}/auth/callback?next=/` },
                })
              }
            >
              Continue with Google
            </Button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/35 px-5 py-4 text-center text-sm text-white/65">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary-300 transition-colors hover:text-primary-200">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  )
}
