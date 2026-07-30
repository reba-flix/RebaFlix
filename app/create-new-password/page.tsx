'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'

export default function CreateNewPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  // Verify the user is authenticated (meaning they successfully passed OTP verification)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast({
          title: "Session Expired",
          description: "Please restart the password reset process.",
          variant: "destructive"
        })
        router.replace('/forgot-password')
      } else {
        setCheckingSession(false)
      }
    })
  }, [supabase.auth, router, toast])

  const getStrength = (pass: string) => {
    let score = 0
    if (pass.length > 7) score += 1
    if (pass.match(/[A-Z]/)) score += 1
    if (pass.match(/[0-9]/)) score += 1
    if (pass.match(/[^A-Za-z0-9]/)) score += 1
    return score
  }

  const strength = getStrength(password)

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    
    if (password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    })

    setLoading(false)

    if (updateError) {
      console.error("Supabase Update Error:", updateError)
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Success",
      description: "Password changed successfully.",
    })

    // Log the user out so they can log back in with their new password?
    // Supabase updateUser leaves them logged in. But usually, we redirect to login anyway.
    // Let's sign out to ensure a clean state if they go to /login
    await supabase.auth.signOut()

    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_50%_0%,_#1a0505_0%,_#0d0d0d_60%,_#000_100%)]">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 pt-20 bg-[radial-gradient(ellipse_at_50%_0%,_#1a0505_0%,_#0d0d0d_60%,_#000_100%)]">
      <section className="w-full max-w-md space-y-4">
        <div className="rounded-xl border border-white/10 bg-black/50 p-7 backdrop-blur-sm shadow-2xl">
          <div className="mb-6 flex items-center gap-3">
            <BrandLogo className="h-12 w-12 flex-shrink-0" priority />
            <h1 className="font-display text-2xl font-black">Create New Password</h1>
          </div>

          <motion.form 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleUpdatePassword} 
            className="space-y-5"
          >
            <div className="space-y-4">
              <div className="relative">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    className="pl-9 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    minLength={8}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="mt-3 flex gap-1 h-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div 
                        key={level} 
                        className={`flex-1 rounded-full transition-colors duration-300 ${
                          strength >= level 
                            ? strength <= 2 ? 'bg-amber-500' : strength === 3 ? 'bg-emerald-400' : 'bg-emerald-500'
                            : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className="pl-9 pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    minLength={8}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button className="w-full h-12 text-base font-semibold mt-2" type="submit" disabled={loading || !password || !confirmPassword}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Save Password
            </Button>
          </motion.form>
        </div>
      </section>
    </main>
  )
}
