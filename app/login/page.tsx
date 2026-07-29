'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/')
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
      // Fall through to home
    }

    router.push('/')
  }

  return (
    <>
      <style>{`
        @keyframes blob-drift-1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(60px, -40px) scale(1.08); }
          66% { transform: translate(-30px, 30px) scale(0.95); }
        }
        @keyframes blob-drift-2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(-50px, 60px) scale(1.05); }
          66% { transform: translate(40px, -20px) scale(0.97); }
        }
        @keyframes blob-drift-3 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(30px, 50px) scale(1.06); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .cinema-input {
          width: 100%;
          padding: 14px 18px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.13);
          border-radius: 12px;
          color: #fff;
          font-size: 15px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
          backdrop-filter: blur(4px);
        }
        .cinema-input::placeholder { color: rgba(255,255,255,0.35); }
        .cinema-input:focus {
          border-color: rgba(229,9,20,0.7);
          background: rgba(255,255,255,0.1);
          box-shadow: 0 0 0 3px rgba(229,9,20,0.15), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .glass-card {
          animation: fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both;
        }
        .sign-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #e50914 0%, #b20710 100%);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;
          box-shadow: 0 4px 24px rgba(229,9,20,0.4), 0 1px 0 rgba(255,255,255,0.1) inset;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .sign-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(229,9,20,0.55), 0 1px 0 rgba(255,255,255,0.1) inset;
        }
        .sign-btn:active:not(:disabled) { transform: translateY(0px); }
        .sign-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .divider {
          display: flex; align-items: center; gap: 12px; margin: 4px 0;
        }
        .divider::before, .divider::after {
          content: ''; flex: 1; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
        }
      `}</style>

      {/* ── Cinematic Background ── */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at 50% 0%, #1a0505 0%, #0d0d0d 60%, #000 100%)',
        }}
      >
        {/* Blob 1 – crimson */}
        <div style={{
          position: 'absolute',
          top: '-10%', left: '-5%',
          width: '55vw', height: '55vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(229,9,20,0.55) 0%, rgba(183,0,10,0.2) 45%, transparent 70%)',
          filter: 'blur(90px)',
          animation: 'blob-drift-1 18s ease-in-out infinite',
        }} />

        {/* Blob 2 – deep amber/gold */}
        <div style={{
          position: 'absolute',
          top: '40%', right: '-10%',
          width: '45vw', height: '45vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,140,0,0.35) 0%, rgba(200,80,0,0.15) 50%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'blob-drift-2 22s ease-in-out infinite',
        }} />

        {/* Blob 3 – midnight blue/violet */}
        <div style={{
          position: 'absolute',
          bottom: '-15%', left: '30%',
          width: '50vw', height: '40vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(80,40,180,0.45) 0%, rgba(40,10,100,0.2) 50%, transparent 70%)',
          filter: 'blur(100px)',
          animation: 'blob-drift-3 26s ease-in-out infinite',
        }} />

        {/* Blob 4 – teal accent */}
        <div style={{
          position: 'absolute',
          top: '20%', left: '55%',
          width: '30vw', height: '30vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,180,160,0.2) 0%, transparent 70%)',
          filter: 'blur(70px)',
          animation: 'blob-drift-1 30s ease-in-out infinite reverse',
        }} />

        {/* Dark vignette overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.65) 100%)',
        }} />

        {/* Subtle grid lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse at 50% 50%, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 30%, transparent 80%)',
        }} />
      </div>

      {/* ── Page ── */}
      <main style={{
        position: 'relative', zIndex: 10,
        display: 'flex', minHeight: '100vh',
        alignItems: 'center', justifyContent: 'center',
        padding: '96px 16px 32px',
      }}>
        <section style={{ width: '100%', maxWidth: 420 }} className="glass-card">

          {/* Glass card */}
          <div style={{
            borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            padding: '36px 32px 32px',
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.05) inset,
              0 1px 0 rgba(255,255,255,0.12) inset,
              0 32px 80px rgba(0,0,0,0.6),
              0 0 60px rgba(229,9,20,0.08)
            `,
          }}>
            {/* Logo + Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              <BrandLogo className="h-12 w-12 flex-shrink-0" priority />
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2, margin: 0 }}>
                  Sign in to RebaFlix
                </h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '3px 0 0' }}>
                  Welcome back — your stories await
                </p>
              </div>
            </div>

            <form
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              onSubmit={async (e) => { e.preventDefault(); await signInWithPassword() }}
            >
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 7, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  className="cinema-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Password
                  </label>
                  <Link href="/forgot-password" style={{ fontSize: 12, color: 'rgba(229,9,20,0.85)', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}>
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="cinema-input"
                    style={{ paddingRight: 40 }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(229,9,20,0.12)', border: '1px solid rgba(229,9,20,0.3)',
                  color: '#fca5a5', fontSize: 13,
                }}>
                  {error}
                </div>
              )}

              {message && (
                <div style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                  color: '#6ee7b7', fontSize: 13,
                }}>
                  {message}
                </div>
              )}

              <button id="login-submit" type="submit" disabled={loading} className="sign-btn" style={{ marginTop: 4 }}>
                {loading ? (
                  <>
                    <Loader2 style={{ width: 17, height: 17, animation: 'spin 1s linear infinite' }} />
                    Signing in…
                  </>
                ) : 'Sign in'}
              </button>
            </form>
          </div>

          {/* Bottom link */}
          <div style={{
            marginTop: 14,
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '16px 20px',
            textAlign: 'center',
            fontSize: 14,
            color: 'rgba(255,255,255,0.55)',
          }}>
            New to RebaFlix?{' '}
            <Link href="/register" style={{ color: '#e50914', fontWeight: 700, textDecoration: 'none' }}>
              Sign up now
            </Link>
          </div>
        </section>
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
