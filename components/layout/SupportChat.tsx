'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Minimize2, GripHorizontal, Edit2, Trash2, Check } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface Message {
  id: string
  isMe: boolean
  senderName: string
  text: string
  time: string
  isAdmin?: boolean
  isSuperAdmin?: boolean
}

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/JBqEezxcNmA7v18YkK5cq8?mode=gi_t'

export function SupportChat() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editInput, setEditInput] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let sid = localStorage.getItem('supportSessionId')
    if (!sid) {
      sid = Math.random().toString(36).substring(2, 15)
      localStorage.setItem('supportSessionId', sid)
    }
    setSessionId(sid)
  }, [])

  const fetchMessages = useCallback(async () => {
    if (!sessionId) return
    try {
      const res = await fetch(`/api/support?sessionId=${sessionId}&t=${Date.now()}`)
      if (!res.ok) return
      const data = await res.json()
      const fetched: Message[] = []
      for (const m of data.messages ?? []) {
        const isMyMessage = user ? m.userId === user.id : m.guestEmail === sessionId
        
        let isSuperAdmin = false
        let isAdmin = false
        let senderName = m.guestName || 'User'

        if (m.user?.roles) {
          const roles = m.user.roles.map((r: any) => r.role.name)
          if (roles.includes('SUPER_ADMIN')) isSuperAdmin = true
          else if (roles.includes('ADMIN')) isAdmin = true
        }

        if (isSuperAdmin || isAdmin) {
          senderName = 'RebaFlix'
        }

        fetched.push({
          id: m.id,
          isMe: !!isMyMessage,
          senderName,
          text: m.message,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAdmin,
          isSuperAdmin,
        })
      }
      setMessages(fetched)
    } catch { /* silent */ }
  }, [sessionId, user])

  useEffect(() => {
    if (open) {
      fetchMessages()
      pollRef.current = setInterval(fetchMessages, 5000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [open, fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)

    // Optimistic add
    let isSuperAdmin = false
    let isAdmin = false
    let senderName = user ? ((user as any).name ?? (user as any).email?.split('@')[0] ?? 'User') : 'Guest'

    if (user && (user as any).roles) {
      const roles = (user as any).roles.map((r: any) => r.role.name)
      if (roles.includes('SUPER_ADMIN')) isSuperAdmin = true
      else if (roles.includes('ADMIN')) isAdmin = true
    }

    if (isSuperAdmin || isAdmin) {
      senderName = 'RebaFlix'
    }

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      isMe: true,
      senderName,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAdmin,
      isSuperAdmin,
    }])

    try {
      await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      })
      await fetchMessages()
    } catch { /* silent */ } finally {
      setSending(false)
    }
  }

  const deleteMessage = async (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id))
    try {
      await fetch(`/api/support/${id}?sessionId=${sessionId}`, { method: 'DELETE' })
      await fetchMessages()
    } catch { /* silent */ }
  }

  const saveEdit = async (id: string) => {
    if (!editInput.trim()) return
    setMessages(prev => prev.map(m => m.id === id ? { ...m, text: editInput.trim() } : m))
    setEditingId(null)
    try {
      await fetch(`/api/support/${id}?sessionId=${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: editInput.trim(), sessionId }),
      })
      await fetchMessages()
    } catch { /* silent */ }
  }

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <>
            <motion.a
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              href={WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="fixed bottom-24 right-6 z-[9999] w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1fb457] shadow-2xl shadow-[#25D366]/30 flex items-center justify-center transition-colors group"
              aria-label="Join RebaFlix WhatsApp Group"
            >
              <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-md bg-black/85 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:block">
                Join WhatsApp Group
              </span>
              <svg
                viewBox="0 0 32 32"
                aria-hidden="true"
                className="w-7 h-7 text-white group-hover:scale-110 transition-transform"
                fill="currentColor"
              >
                <path d="M16.02 4C9.4 4 4.02 9.38 4.02 16c0 2.15.58 4.25 1.69 6.08L4 28l6.08-1.6A11.9 11.9 0 0 0 16.02 28c6.62 0 12-5.38 12-12s-5.38-12-12-12Zm0 21.82c-1.84 0-3.63-.51-5.19-1.47l-.37-.23-3.61.95.96-3.52-.24-.37A9.75 9.75 0 0 1 6.2 16c0-5.41 4.4-9.82 9.82-9.82 5.41 0 9.82 4.41 9.82 9.82s-4.41 9.82-9.82 9.82Zm5.39-7.35c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.95 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.76-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.07 2.88 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
              </svg>
            </motion.a>
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => setOpen(true)}
              className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-[#E50914] hover:bg-[#c0070f] shadow-2xl shadow-[#E50914]/40 flex items-center justify-center transition-colors group"
              aria-label="Open global chat"
            >
              <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-black animate-pulse" />
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0}
            ref={chatRef}
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] w-[90vw] sm:w-[360px] rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 flex flex-col bg-[#141414]"
          >
            {/* Header (drag handle) */}
            <div
              className="flex items-center justify-between px-4 py-3 bg-[#E50914] cursor-grab active:cursor-grabbing select-none"
            >
              <div className="flex items-center gap-2">
                <GripHorizontal className="w-4 h-4 text-white/70" />
                <div>
                  <p className="text-sm font-semibold text-white">Global Chat</p>
                  <p className="text-[10px] text-white/70 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse" />
                    Public room
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setMinimized(!minimized)}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
                  aria-label="Minimize"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <AnimatePresence>
              {!minimized && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  {/* Messages */}
                  <div className="h-72 overflow-y-auto bg-[#141414] p-4 flex flex-col gap-3">
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageCircle className="w-8 h-8 text-white/20 mb-2" />
                        <p className="text-xs text-white/40">Say hello to the community!</p>
                      </div>
                    )}
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] gap-0.5 group/msg ${msg.isMe ? 'self-end items-end' : 'self-start items-start'}`}
                      >
                        {!msg.isMe && (
                          <span className={`text-[10px] px-1 font-semibold ${
                            msg.isSuperAdmin ? 'text-[#E50914]' : msg.isAdmin ? 'text-green-500' : 'text-white/50'
                          }`}>
                            {msg.senderName}
                          </span>
                        )}
                        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-md flex items-center gap-2 ${
                          msg.isSuperAdmin
                            ? 'bg-gradient-to-r from-[#E50914] to-green-600 text-white rounded-bl-sm'
                            : msg.isAdmin
                            ? 'bg-yellow-600 text-white rounded-bl-sm'
                            : msg.isMe
                            ? 'bg-[#E50914] text-white rounded-br-sm'
                            : 'bg-white/10 text-white/90 rounded-bl-sm'
                        }`}>
                          {editingId === msg.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                autoFocus
                                type="text"
                                value={editInput}
                                onChange={(e) => setEditInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && saveEdit(msg.id)}
                                className="bg-white/20 text-white px-2 py-1 rounded text-sm outline-none border border-white/30"
                              />
                              <button onClick={() => saveEdit(msg.id)} className="text-white hover:text-green-300">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingId(null)} className="text-white hover:text-red-300">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span>{msg.text}</span>
                              {msg.isMe && (
                                <div className="flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity ml-1">
                                  <button
                                    onClick={() => { setEditingId(msg.id); setEditInput(msg.text); }}
                                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                                  >
                                    <Edit2 className="w-3 h-3 text-white" />
                                  </button>
                                  <button
                                    onClick={() => deleteMessage(msg.id)}
                                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3 text-white" />
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        <span className="text-[10px] text-white/30 px-1">{msg.time}</span>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>

                  {/* Input */}
                  <div className="flex items-center gap-2 p-3 bg-[#1a1a1a] border-t border-white/5">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#E50914]/50 transition-colors"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || sending}
                      className="w-9 h-9 rounded-xl bg-[#E50914] hover:bg-[#c0070f] disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
