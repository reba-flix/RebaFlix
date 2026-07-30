'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Pin, Trash2, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

type CommentType = {
  id: string
  body: string
  createdAt: string
  isPinned: boolean
  userId: string
  user: {
    id: string
    name: string | null
    avatarUrl: string | null
  }
}

export function CommentsSection({
  targetId,
  targetType,
  currentUserId,
  isAdmin,
}: {
  targetId: string
  targetType: 'movie' | 'series' | 'episode'
  currentUserId?: string
  isAdmin?: boolean
}) {
  const [comments, setComments] = useState<CommentType[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchComments()
  }, [targetId])

  async function fetchComments() {
    setLoading(true)
    try {
      const res = await fetch(`/api/comments?${targetType}Id=${targetId}`)
      if (res.ok) {
        const data = await res.json()
        setComments(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentUserId) {
      router.push('/login')
      return
    }
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [`${targetType}Id`]: targetId, body: newComment }),
      })

      if (res.ok) {
        const comment = await res.json()
        setComments((prev) => [comment, ...prev])
        setNewComment('')
      } else {
        toast({ title: 'Error', description: 'Failed to post comment', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to post comment', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  async function togglePin(commentId: string, currentPinned: boolean) {
    if (!isAdmin) return

    try {
      // Optimistic update
      setComments((prev) => {
        const updated = prev.map((c) =>
          c.id === commentId ? { ...c, isPinned: !currentPinned } : c
        )
        return updated.sort((a, b) => {
          if (a.isPinned === b.isPinned) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          return a.isPinned ? -1 : 1
        })
      })

      const res = await fetch(`/api/comments/${commentId}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !currentPinned }),
      })

      if (!res.ok) {
        throw new Error('Failed to pin')
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update pin status', variant: 'destructive' })
      fetchComments() // Revert on error
    }
  }

  async function deleteComment(commentId: string) {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      // Optimistic update
      setComments((prev) => prev.filter((c) => c.id !== commentId))

      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
      if (!res.ok) {
        throw new Error('Failed to delete')
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete comment', variant: 'destructive' })
      fetchComments() // Revert on error
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 py-8 border-t border-white/10">
      <h2 className="text-xl font-bold text-white mb-6">Comments ({comments.length})</h2>

      {currentUserId ? (
        <form onSubmit={handleSubmit} className="flex gap-4 mb-8">
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]/50 transition-all resize-none h-24"
              maxLength={500}
            />
            <div className="flex justify-end mt-2">
              <Button type="submit" disabled={!newComment.trim() || submitting} className="bg-[#E50914] hover:bg-[#b80710] text-white gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Post Comment
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10 text-center">
          <p className="text-white/60 mb-3">You must be logged in to post a comment.</p>
          <Button onClick={() => router.push('/login')} className="bg-white text-black hover:bg-white/90">
            Log In
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={cn(
                "flex gap-4 p-4 rounded-xl border transition-colors",
                comment.isPinned ? "bg-white/[0.04] border-white/20" : "bg-transparent border-transparent hover:bg-white/[0.02]"
              )}
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 bg-white/10">
                {comment.user.avatarUrl ? (
                  <Image src={comment.user.avatarUrl} alt={comment.user.name || 'User'} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/50 text-sm font-bold">
                    {(comment.user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white text-sm">{comment.user.name || 'Anonymous User'}</span>
                  <span className="text-white/40 text-xs text-nowrap">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                  {comment.isPinned && (
                    <span className="flex items-center gap-1 text-[#E50914] text-xs font-semibold ml-2">
                      <Pin className="w-3 h-3 fill-current" /> Pinned
                    </span>
                  )}
                </div>
                <p className="text-white/80 text-sm whitespace-pre-wrap break-words">
                  {comment.body}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  {(isAdmin || currentUserId === comment.userId) && (
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="text-white/40 hover:text-red-500 text-xs flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => togglePin(comment.id, comment.isPinned)}
                      className="text-white/40 hover:text-white text-xs flex items-center gap-1 transition-colors"
                    >
                      <Pin className="w-3.5 h-3.5" /> {comment.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-white/40">No comments yet. Be the first to share your thoughts!</p>
        </div>
      )}
    </div>
  )
}
