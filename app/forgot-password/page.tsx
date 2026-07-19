'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Mail, Lock, KeyRound, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email)

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }

    setStep('otp')
    setMessage('Verification code sent to your email.')
  }

  async function handleVerifyAndReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    // First verify the OTP
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'recovery'
    })

    if (verifyError) {
      setLoading(false)
      setError(verifyError.message)
      return
    }

    // Now update the user's password
    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    })

    setLoading(false)
    if (updateError) {
      setError(updateError.message)
      return
    }

    setMessage('Password successfully reset! Redirecting to login...')
    setTimeout(() => {
      window.location.assign('/login')
    }, 2000)
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 pt-20">
      <section className="w-full max-w-md space-y-4">
        <div className="rounded-xl border border-white/10 bg-black/50 p-7 backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3">
            <BrandLogo className="h-12 w-12 flex-shrink-0" priority />
            <h1 className="font-display text-2xl font-black">Reset Password</h1>
          </div>

          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-sm text-white/60 mb-2">
                Enter your email address and we'll send you a 6-digit code to reset your password.
              </p>
              
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  type="email"
                  required
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </p>
              )}
              {message && (
                <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  {message}
                </p>
              )}

              <Button className="w-full" type="submit" disabled={loading || !email}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Reset Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndReset} className="space-y-4">
              <p className="text-sm text-white/60 mb-2">
                Enter the 6-digit code sent to <strong>{email}</strong> and your new password.
              </p>

              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  type="text"
                  required
                  className="pl-9 tracking-widest text-lg font-medium"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <div className="relative mt-3">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  type="password"
                  required
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  minLength={6}
                />
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 mt-2">
                  {error}
                </p>
              )}
              {message && (
                <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 mt-2">
                  {message}
                </p>
              )}

              <Button className="w-full mt-4" type="submit" disabled={loading || !otp || !password}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Reset Password
              </Button>
            </form>
          )}
          
          <div className="mt-6 flex justify-center">
            <Link href="/login" className="flex items-center text-sm text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to log in
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
