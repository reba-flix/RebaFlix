'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Lock, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [validatingSession, setValidatingSession] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)

  useEffect(() => {
    // Check if we have a valid session or hash fragments from the recovery link
    const checkSession = async () => {
      // Supabase's client automatically handles the #access_token fragment on load
      // and exchanges it for a session if we are using the browser client.
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        setSessionError("Invalid or expired password reset link.")
      } else if (!session) {
        // We wait a brief moment in case the onAuthStateChange is still firing
        setTimeout(async () => {
          const { data: { session: delayedSession } } = await supabase.auth.getSession()
          if (!delayedSession) {
            setSessionError("Invalid or expired password reset link.")
          }
          setValidatingSession(false)
        }, 1000)
        return
      }
      
      setValidatingSession(false)
    }

    checkSession()

    // Listen to auth state changes in case the session is established after mount
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionError(null)
        setValidatingSession(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

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
      description: "Password updated successfully.",
    })

    // Redirect after 3 seconds
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 pt-20">
      <section className="w-full max-w-md space-y-4">
        <div className="rounded-xl border border-white/10 bg-black/50 p-7 backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3">
            <BrandLogo className="h-12 w-12 flex-shrink-0" priority />
            <h1 className="font-display text-2xl font-black">Set New Password</h1>
          </div>

          {validatingSession ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-white/50" />
              <p className="text-sm text-white/60">Verifying reset link...</p>
            </div>
          ) : sessionError ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center py-6 space-y-4"
            >
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-red-400 font-medium">{sessionError}</p>
              <Link href="/forgot-password">
                <Button variant="outline" className="mt-4 bg-white/5 border-white/10 hover:bg-white/10">
                  Request New Link
                </Button>
              </Link>
            </motion.div>
          ) : (
            <motion.form 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleUpdatePassword} 
              className="space-y-4"
            >
              <p className="text-sm text-white/60 mb-4">
                Please enter your new password below. Must be at least 8 characters.
              </p>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  type="password"
                  required
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  minLength={8}
                  disabled={loading}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  type="password"
                  required
                  className="pl-9"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  minLength={8}
                  disabled={loading}
                />
              </div>

              <Button className="w-full mt-2" type="submit" disabled={loading || !password || !confirmPassword}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Change Password
              </Button>
            </motion.form>
          )}
        </div>
      </section>
    </main>
  )
}
