'use client'

import { useState } from 'react'
import { User, Mail, Phone, Save, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type UserData = {
  name: string
  email: string
  phone: string
}

type SettingsFormProps = {
  initialData: UserData
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [form, setForm] = useState<UserData>(initialData)
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (status !== 'idle') setStatus('idle')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('saving')
    setErrorMsg('')

    try {
      const res = await fetch('/api/me/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      setStatus('success')
      // Auto-reset success banner after 3 s
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setStatus('error')
      setErrorMsg('Network error. Please check your connection.')
    }
  }

  const isDirty =
    form.name !== initialData.name ||
    form.email !== initialData.email ||
    form.phone !== initialData.phone

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Banner */}
      {status === 'success' && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-5 py-4 text-emerald-400 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          Profile updated successfully!
          {form.email !== initialData.email && (
            <span className="ml-1 text-white/50">Check your new email for a confirmation link.</span>
          )}
        </div>
      )}

      {/* Error Banner */}
      {status === 'error' && (
        <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/30 px-5 py-4 text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="settings-name" className="block text-sm font-medium text-white/70">
          Display Name
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            id="settings-name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Your name"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/25 focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition-colors text-sm"
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="settings-email" className="block text-sm font-medium text-white/70">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            id="settings-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/25 focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition-colors text-sm"
          />
        </div>
        {form.email !== initialData.email && (
          <p className="text-xs text-amber-400/80 flex items-center gap-1.5 mt-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Changing your email will send a confirmation link to the new address.
          </p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <label htmlFor="settings-phone" className="block text-sm font-medium text-white/70">
          Phone Number <span className="text-white/30 font-normal">(optional)</span>
        </label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            id="settings-phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="+1 555 000 0000"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/25 focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition-colors text-sm"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={status === 'saving' || !isDirty}
          className="inline-flex items-center gap-2 bg-[#E50914] hover:bg-[#c40812] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          {status === 'saving' ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  )
}
