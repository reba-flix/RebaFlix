'use client'

import { useState } from 'react'
import { Lock, Save, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function PasswordUpdateForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || password.length < 6) {
      setStatus('error')
      setErrorMsg('Password must be at least 6 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setStatus('error')
      setErrorMsg('Passwords do not match.')
      return
    }

    setStatus('saving')
    setErrorMsg('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
      return
    }

    setStatus('success')
    setPassword('')
    setConfirmPassword('')
    setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-10 pt-10 border-t border-white/10">
      <div>
        <h2 className="text-xl font-semibold text-white font-display mb-1">Update Password</h2>
        <p className="text-sm text-white/40 mb-6">Ensure your account is using a long, random password to stay secure.</p>
      </div>

      {status === 'success' && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-5 py-4 text-emerald-400 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          Password updated successfully!
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/30 px-5 py-4 text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {errorMsg}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="settings-password" className="block text-sm font-medium text-white/70">
          New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            id="settings-password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setStatus('idle') }}
            placeholder="Enter new password"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/25 focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition-colors text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="settings-confirm-password" className="block text-sm font-medium text-white/70">
          Confirm New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            id="settings-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setStatus('idle') }}
            placeholder="Confirm new password"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/25 focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition-colors text-sm"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={status === 'saving' || !password || !confirmPassword}
          className="inline-flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          {status === 'saving' ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Updating…
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Update Password
            </>
          )}
        </button>
      </div>
    </form>
  )
}
