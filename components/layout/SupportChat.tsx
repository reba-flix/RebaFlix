'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Minimize2, GripHorizontal } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface Message {
  id: string
  isMe: boolean
  senderName: string
  text: string
  time: string
}

export function SupportChat() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
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
        fetched.push({
          id: m.id,
          isMe: !!isMyMessage,
          senderName: m.guestName || 'User',
          text: m.message,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      isMe: true,
      senderName: user ? ((user as any).name ?? (user as any).email?.split('@')[0] ?? 'User') : 'Guest',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
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
                        className={`flex flex-col max-w-[85%] gap-0.5 ${msg.isMe ? 'self-end items-end' : 'self-start items-start'}`}
                      >
                        {!msg.isMe && (
                          <span className="text-[10px] text-white/50 px-1">{msg.senderName}</span>
                        )}
                        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          msg.isMe
                            ? 'bg-[#E50914] text-white rounded-br-sm shadow-md'
                            : 'bg-white/10 text-white/90 rounded-bl-sm shadow-md'
                        }`}>
                          {msg.text}
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
