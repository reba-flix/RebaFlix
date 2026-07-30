'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const { toast } = useToast()
  
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  async function handleSendResetLink(e: React.FormEvent) {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    // Determine the base URL for the redirect
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    (typeof window !== 'undefined' ? window.location.origin : 'https://rebaaflix.com')
    const redirectTo = `${siteUrl}/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    setLoading(false)

    if (error) {
      console.error("Supabase Reset Error:", error)
      let errorMessage = "Failed to send reset link. Please try again later."
      
      if (error.message.includes('over_email_send_rate_limit') || error.status === 429) {
        errorMessage = "Too many requests. Please try again later."
      } else if (error.message.includes('not found') || error.status === 404) {
        errorMessage = "Email not found."
      } else if (error.message.includes('Network')) {
        errorMessage = "Network error. Please check your connection."
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      return
    }

    setIsSent(true)
    toast({
      title: "Success",
      description: "Password reset email sent.",
    })
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 pt-20">
      <section className="w-full max-w-md space-y-4">
        <div className="rounded-xl border border-white/10 bg-black/50 p-7 backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3">
            <BrandLogo className="h-12 w-12 flex-shrink-0" priority />
            <h1 className="font-display text-2xl font-black">Reset Password</h1>
          </div>

          {!isSent ? (
            <motion.form 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSendResetLink} 
              className="space-y-4"
            >
              <p className="text-sm text-white/60 mb-2">
                Enter your email address and we'll send you a link to reset your password.
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
                  disabled={loading}
                />
              </div>

              <Button className="w-full" type="submit" disabled={loading || !email}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Reset Link
              </Button>
            </motion.form>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 text-center py-4"
            >
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
              <h2 className="text-xl font-semibold">Check your email</h2>
              <p className="text-sm text-white/60">
                We've sent password reset instructions to <br/>
                <span className="text-white font-medium">{email}</span>
              </p>
              <Button 
                variant="outline" 
                className="w-full mt-4 bg-white/5 border-white/10 hover:bg-white/10"
                onClick={() => setIsSent(false)}
              >
                Try another email
              </Button>
            </motion.div>
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

