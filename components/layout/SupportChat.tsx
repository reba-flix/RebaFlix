'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Minimize2, GripHorizontal } from 'lucide-react'

interface Message {
  id: string
  from: 'user' | 'admin'
  text: string
  time: string
}

export function SupportChat() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 })
  const chatRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/support')
      if (!res.ok) return
      const data = await res.json()
      const fetched: Message[] = []
      for (const m of data.messages ?? []) {
        fetched.push({
          id: m.id + '-u',
          from: 'user',
          text: m.message,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
        if (m.reply) {
          fetched.push({
            id: m.id + '-a',
            from: 'admin',
            text: m.reply,
            time: new Date(m.repliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          })
        }
      }
      setMessages(fetched)
    } catch { /* silent */ }
  }, [])

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

  // Drag logic
  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true)
    dragStart.current = { mx: e.clientX, my: e.clientY, px: position.x, py: position.y }
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging) return
      setPosition({
        x: dragStart.current.px + (e.clientX - dragStart.current.mx),
        y: dragStart.current.py + (e.clientY - dragStart.current.my),
      })
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging])

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)

    // Optimistic add
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      from: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }])

    try {
      await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
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
            aria-label="Open support chat"
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
            ref={chatRef}
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            className="fixed bottom-6 right-6 z-[9999] w-[340px] rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10 flex flex-col"
          >
            {/* Header (drag handle) */}
            <div
              onMouseDown={onMouseDown}
              className="flex items-center justify-between px-4 py-3 bg-[#E50914] cursor-grab active:cursor-grabbing select-none"
            >
              <div className="flex items-center gap-2">
                <GripHorizontal className="w-4 h-4 text-white/70" />
                <div>
                  <p className="text-sm font-semibold text-white">RebaFlix Support</p>
                  <p className="text-[10px] text-white/70 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                    Admin is online
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
                        <p className="text-xs text-white/40">Send a message and our team<br/>will get back to you shortly.</p>
                      </div>
                    )}
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[80%] gap-1 ${msg.from === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                      >
                        {msg.from === 'admin' && (
                          <span className="text-[10px] text-[#E50914] font-semibold px-1">Admin</span>
                        )}
                        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          msg.from === 'user'
                            ? 'bg-[#E50914] text-white rounded-br-sm'
                            : 'bg-white/10 text-white/90 rounded-bl-sm'
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
