'use client'

import { useState } from 'react'
import { toggleAdminRole } from './actions'
import { Shield, ShieldAlert, Loader2 } from 'lucide-react'

type UserRoleToggleProps = {
  userId: string
  isAdmin: boolean
  isSuperAdmin: boolean
}

export function UserRoleToggle({ userId, isAdmin, isSuperAdmin }: UserRoleToggleProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleToggle = async () => {
    try {
      setLoading(true)
      setError(null)
      await toggleAdminRole(userId, !isAdmin)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (isSuperAdmin) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
        <ShieldAlert className="w-3.5 h-3.5" />
        Super Admin
      </span>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
          isAdmin 
            ? 'bg-blue-500/10 text-blue-400 hover:bg-red-500/10 hover:text-red-400 border border-blue-500/20 hover:border-red-500/20' 
            : 'bg-white/5 text-white/50 hover:bg-blue-500/10 hover:text-blue-400 border border-transparent hover:border-blue-500/20'
        }`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Shield className="w-3.5 h-3.5" />
        )}
        {isAdmin ? 'Revoke Admin' : 'Make Admin'}
      </button>
      {error && <p className="text-red-400 text-[10px] max-w-[150px] text-right">{error}</p>}
    </div>
  )
}
