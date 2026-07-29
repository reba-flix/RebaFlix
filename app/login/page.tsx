'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

  async function signInWithPassword() {
    setLoading(true)
    setError(null)
    setMessage(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setLoading(false)
      setError(error.message)
      return
    }

    try {
      const res = await fetch('/api/me')
      if (res.ok) {
        const me = await res.json()
        if (me.isAdmin) {
          router.push('/admin')
          return
        }
      }
    } catch {
      // Fall through to home if the role check is unavailable.
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
      {/* Film-strip shimmer line */}
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
            <h1 className="font-display text-2xl font-black">Sign in to RebaFlix</h1>
          </div>

          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault()
              await signInWithPassword()
            }}
          >
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                id="login-email"
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
                id="login-password"
                type="password"
                required
                className="pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
            </div>

            <div className="flex justify-end mt-1">
              <Link href="/forgot-password" className="text-xs text-primary-300 hover:text-primary-200 transition-colors font-medium">
                Forgot password?
              </Link>
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

            <Button id="login-submit" className="w-full" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>

        <div
          className="rounded-xl border border-white/10 px-5 py-4 text-center text-sm text-white/65 backdrop-blur-xl"
          style={{ background: 'rgba(14, 14, 14, 0.55)' }}
        >
          New to RebaFlix?{' '}
          <Link href="/register" className="font-semibold text-primary-300 transition-colors hover:text-primary-200">
            Sign up now
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
