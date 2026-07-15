'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, CheckCheck } from 'lucide-react'

interface SupportMessage {
  id: string
  message: string
  reply: string | null
  guestName: string | null
  guestEmail: string | null
  createdAt: string
  repliedAt: string | null
  user: { email: string; name: string | null } | null
}

export function AdminInboxClient({ messages: initial }: { messages: SupportMessage[] }) {
  const [messages, setMessages] = useState(initial)
  const [selected, setSelected] = useState<SupportMessage | null>(initial[0] ?? null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/admin/support/messages?t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        if (data.messages) {
          const formatted = data.messages.map((m: any) => ({
            ...m,
            createdAt: new Date(m.createdAt).toISOString(),
            repliedAt: m.repliedAt ? new Date(m.repliedAt).toISOString() : null,
          }))
          setMessages(formatted)
          if (selected) {
            // Update the selected message if it was modified
            const updatedSelected = formatted.find((m: any) => m.id === selected.id)
            if (updatedSelected) setSelected(updatedSelected)
          }
        }
      }
    } catch { /* silent */ }
  }

  useEffect(() => {
    // Poll every 5 seconds for new messages
    pollRef.current = setInterval(fetchMessages, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [selected])

  const sendReply = async () => {
    if (!reply.trim() || !selected || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/support/${selected.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: reply.trim() }),
      })
      if (res.ok) {
        const updated = messages.map((m) =>
          m.id === selected.id ? { ...m, reply: reply.trim(), repliedAt: new Date().toISOString() } : m
        )
        setMessages(updated)
        setSelected(updated.find((m) => m.id === selected.id) ?? null)
        setReply('')
      }
    } finally {
      setSending(false)
    }
  }

  const senderName = (m: SupportMessage) =>
    m.user?.name || m.user?.email || m.guestName || 'Guest'

  return (
    <div className="flex gap-0 rounded-xl border border-white/10 overflow-hidden bg-[#1a1a1a]" style={{ minHeight: '520px' }}>
      {/* Sidebar */}
      <div className="w-64 border-r border-white/10 overflow-y-auto shrink-0">
        {messages.length === 0 && (
          <p className="p-6 text-white/40 text-sm text-center">No messages yet.</p>
        )}
        {messages.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelected(m)}
            className={`w-full text-left p-4 border-b border-white/5 transition-colors ${
              selected?.id === m.id ? 'bg-white/10' : 'hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white truncate">{senderName(m)}</span>
              {m.reply && <CheckCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1" />}
            </div>
            <p className="text-xs text-white/50 truncate">{m.message}</p>
            <p className="text-[10px] text-white/30 mt-1">
              {new Date(m.createdAt).toLocaleDateString()}
            </p>
          </button>
        ))}
      </div>

      {/* Chat panel */}
      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            {/* Chat header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{senderName(selected)}</p>
                {selected.user?.email && (
                  <p className="text-xs text-white/50">{selected.user.email}</p>
                )}
                {selected.guestEmail && (
                  <p className="text-xs text-white/50">{selected.guestEmail}</p>
                )}
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                selected.reply ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {selected.reply ? 'Replied' : 'Pending'}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {/* User message */}
              <div className="flex flex-col items-start gap-1 max-w-[75%]">
                <span className="text-xs text-white/40 px-1">{senderName(selected)}</span>
                <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-white/90 leading-relaxed whitespace-pre-wrap break-words">
                  {selected.message}
                </div>
                <span className="text-[10px] text-white/30 px-1">
                  {new Date(selected.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Admin reply */}
              {selected.reply && (
                <div className="flex flex-col items-end gap-1 max-w-[75%] self-end">
                  <span className="text-xs text-[#E50914] font-semibold px-1">You (Admin)</span>
                  <div className="bg-[#E50914] rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white leading-relaxed whitespace-pre-wrap break-words">
                    {selected.reply}
                  </div>
                  {selected.repliedAt && (
                    <span className="text-[10px] text-white/30 px-1">
                      {new Date(selected.repliedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Reply input */}
            <div className="p-4 border-t border-white/10 flex gap-3">
              <input
                type="text"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                placeholder={selected.reply ? 'Send another reply...' : 'Type your reply...'}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#E50914]/50 transition-colors"
              />
              <button
                onClick={sendReply}
                disabled={!reply.trim() || sending}
                className="px-4 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#c0070f] disabled:opacity-40 flex items-center gap-2 text-sm font-medium text-white transition-colors shrink-0"
              >
                <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Reply'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/30 text-sm">Select a conversation to reply</p>
          </div>
        )}
      </div>
    </div>
  )
}
