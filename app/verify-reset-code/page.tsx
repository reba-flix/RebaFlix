'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import Link from 'next/link'

function VerifyOTPContent() {
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!email) {
      router.replace('/forgot-password')
    }
  }, [email, router])

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timerId)
    }
  }, [timeLeft])

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return

    const newOtp = [...otp]
    newOtp[index] = value.substring(value.length - 1)
    setOtp(newOtp)

    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('')
    if (pastedData.some(char => isNaN(Number(char)))) return

    const newOtp = [...otp]
    pastedData.forEach((char, index) => {
      if (index < 6) newOtp[index] = char
    })
    setOtp(newOtp)

    const focusIndex = Math.min(pastedData.length, 5)
    inputRefs.current[focusIndex]?.focus()
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    const code = otp.join('')
    
    if (code.length < 6) {
      toast({
        title: "Incomplete Code",
        description: "Please enter all 6 digits.",
        variant: "destructive"
      })
      return
    }

    if (!email) return

    setLoading(true)

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'recovery'
    })

    setLoading(false)

    if (error) {
      let errorMessage = "Invalid or expired verification code."
      if (error.message.includes('rate_limit') || error.status === 429) {
        errorMessage = "Too many attempts. Please try again later."
      } else if (error.message.includes('expired')) {
        errorMessage = "This code has expired. Please request a new one."
      }
      
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive"
      })
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
      return
    }

    toast({
      title: "Code Verified",
      description: "You can now create a new password.",
    })
    
    router.push('/create-new-password')
  }

  async function handleResendCode() {
    if (!email || timeLeft > 0) return
    
    setResendLoading(true)
    
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    
    setResendLoading(false)
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to resend code. Please try again.",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Code Resent",
      description: "A new verification code has been sent.",
    })
    
    setTimeLeft(60)
  }

  if (!email) return null

  return (
    <section className="w-full max-w-md space-y-4">
      <div className="rounded-xl border border-white/10 bg-black/50 p-7 backdrop-blur-sm shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <BrandLogo className="h-12 w-12 flex-shrink-0" priority />
          <h1 className="font-display text-2xl font-black">Verify Code</h1>
        </div>

        <motion.form 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleVerify} 
          className="space-y-6"
        >
          <div>
            <p className="text-sm text-white/60 mb-1">
              We sent a verification code to:
            </p>
            <p className="font-medium text-white break-all bg-white/5 p-3 rounded-lg border border-white/10">
              {email}
            </p>
          </div>
          
          <div className="space-y-3">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Enter 6-digit code
            </label>
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  disabled={loading}
                  className="w-12 h-14 text-center text-xl font-bold rounded-lg border border-white/10 bg-white/5 text-white focus:bg-white/10 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                />
              ))}
            </div>
          </div>

          <Button className="w-full h-12 text-base font-semibold" type="submit" disabled={loading || otp.join('').length < 6}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Verify Code
          </Button>
        </motion.form>
        
        <div className="mt-6 pt-6 border-t border-white/10 text-center flex flex-col items-center gap-4">
          <div className="text-sm text-white/60">
            Didn't receive the code?
            {timeLeft > 0 ? (
              <span className="block mt-1 text-white/40">Resend in {timeLeft}s</span>
            ) : (
              <button 
                type="button"
                onClick={handleResendCode}
                disabled={resendLoading}
                className="block mt-1 text-red-500 hover:text-red-400 font-medium transition-colors flex items-center justify-center w-full gap-2"
              >
                {resendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Resend Code
              </button>
            )}
          </div>
          
          <Link href="/forgot-password" className="flex items-center text-sm text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Change email
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function VerifyResetCodePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 pt-20 bg-[radial-gradient(ellipse_at_50%_0%,_#1a0505_0%,_#0d0d0d_60%,_#000_100%)]">
      <Suspense fallback={<div className="flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-red-500" /></div>}>
        <VerifyOTPContent />
      </Suspense>
    </main>
  )
}
