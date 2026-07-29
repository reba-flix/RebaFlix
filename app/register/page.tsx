'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Lock, Mail, User } from 'lucide-react'

export default function RegisterPage() {
  const supabase = createClient()
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/')
      }
    })
  }, [supabase, router])

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
      router.push('/login')
      return
    }

    router.push('/')
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center px-4 pt-20 overflow-hidden"
    >
      {/* Cinematic background — layered movie-style imagery */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'linear-gradient(135deg, #0d0d0d 0%, #1a0a0a 25%, #0a0a1a 50%, #0d1a0d 75%, #1a0d00 100%)',
        }}
      />
      {/* Animated gradient orbs simulating movie posters light leaks */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 15% 50%, rgba(229,9,20,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 60% 80% at 85% 30%, rgba(255,120,0,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 50% 50% at 50% 90%, rgba(30,30,80,0.35) 0%, transparent 70%)
          `,
        }}
      />
      {/* Film-strip shimmer lines */}
      <div
        className="absolute top-0 left-0 right-0 h-px z-0"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(229,9,20,0.6), transparent)' }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px z-0"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(229,9,20,0.4), transparent)' }}
      />

      {/* Scrolling movie title bars in background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-[0.07]">
        {[
          'ACTION  •  DRAMA  •  THRILLER  •  ROMANCE  •  COMEDY  •  HORROR  •  SCI-FI  •  DOCUMENTARY',
          'TRENDING  •  NEW RELEASES  •  TOP RATED  •  ORIGINALS  •  LIVE TV  •  4K  •  SERIES',
          'ACTION  •  DRAMA  •  THRILLER  •  ROMANCE  •  COMEDY  •  HORROR  •  SCI-FI  •  DOCUMENTARY',
          'TRENDING  •  NEW RELEASES  •  TOP RATED  •  ORIGINALS  •  LIVE TV  •  4K  •  SERIES',
        ].map((text, i) => (
          <div
            key={i}
            className="absolute whitespace-nowrap text-white font-black tracking-[0.3em] text-sm"
            style={{
              top: `${15 + i * 22}%`,
              animation: `marquee-${i % 2 === 0 ? 'left' : 'right'} ${22 + i * 4}s linear infinite`,
              left: i % 2 === 0 ? '0' : undefined,
              right: i % 2 !== 0 ? '0' : undefined,
            }}
          >
            {text} &nbsp;&nbsp;&nbsp; {text} &nbsp;&nbsp;&nbsp; {text}
          </div>
        ))}
      </div>

      {/* Card */}
      <section className="relative z-10 w-full max-w-md space-y-4">
        <div
          className="rounded-2xl border border-white/10 p-7 backdrop-blur-xl"
          style={{
            background: 'rgba(14, 14, 14, 0.72)',
            boxShadow: '0 0 0 1px rgba(229,9,20,0.08), 0 25px 50px rgba(0,0,0,0.7)',
          }}
        >
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
                type="password"
                required
                minLength={6}
                className="pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                id="register-confirm-password"
                type="password"
                required
                minLength={6}
                className="pl-9"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
              />
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
              ) : (
                'Sign up'
              )}
            </Button>
          </form>
        </div>

        <div
          className="rounded-xl border border-white/10 px-5 py-4 text-center text-sm text-white/65 backdrop-blur-xl"
          style={{ background: 'rgba(14, 14, 14, 0.55)' }}
        >
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary-300 transition-colors hover:text-primary-200">
            Sign in
          </Link>
        </div>
      </section>

      <style jsx>{`
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </main>
  )
}
