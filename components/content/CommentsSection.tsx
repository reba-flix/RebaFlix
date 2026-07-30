'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Pin, Trash2, Loader2, Send, CornerDownRight, ChevronDown, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

type ReplyType = {
  id: string
  body: string
  createdAt: string
  isPinned: boolean
  userId: string
  parentId: string | null
  user: {
    id: string
    name: string | null
    avatarUrl: string | null
  }
}

type CommentType = ReplyType & {
  replies: ReplyType[]
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function UserAvatar({ name, avatarUrl, size = 10 }: { name?: string | null; avatarUrl?: string | null; size?: number }) {
  return (
    <div
      className={`relative rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-[#E50914]/30 to-[#b80710]/20`}
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt={name || 'User'} fill className="object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/70 font-bold" style={{ fontSize: `${size * 1.4}px` }}>
          {(name || 'U').charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  )
}

// ─── Reply Input ──────────────────────────────────────────────────────────────

function ReplyInput({
  onSubmit,
  onCancel,
}: {
  onSubmit: (body: string) => Promise<void>
  onCancel: () => void
}) {
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSubmitting(true)
    try {
      await onSubmit(body)
      setBody('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 ml-1 flex gap-3 items-start">
      <div className="flex-1">
        <textarea
          autoFocus
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a reply..."
          rows={2}
          maxLength={500}
          className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#E50914]/60 focus:ring-1 focus:ring-[#E50914]/20 transition-all resize-none"
        />
        <div className="flex items-center justify-between mt-1.5">
          <button type="button" onClick={onCancel} className="text-xs text-white/40 hover:text-white/70 transition-colors">
            Cancel
          </button>
          <Button type="submit" disabled={!body.trim() || submitting} size="sm" className="h-7 text-xs bg-[#E50914] hover:bg-[#b80710] text-white gap-1.5">
            {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            Reply
          </Button>
        </div>
      </div>
    </form>
  )
}

// ─── Single Reply ──────────────────────────────────────────────────────────────

function ReplyItem({
  reply,
  currentUserId,
  isAdmin,
  onDelete,
}: {
  reply: ReplyType
  currentUserId?: string
  isAdmin?: boolean
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex gap-3 group">
      <UserAvatar name={reply.user.name} avatarUrl={reply.user.avatarUrl} size={8} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-white/90 text-xs">{reply.user.name || 'Anonymous'}</span>
          <span className="text-white/30 text-[11px]">
            {new Date(reply.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <p className="text-white/70 text-sm whitespace-pre-wrap break-words leading-relaxed">{reply.body}</p>
        {(isAdmin || currentUserId === reply.userId) && (
          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onDelete(reply.id)}
              className="text-white/30 hover:text-red-500 text-xs flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Single Comment ────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  currentUserId,
  isAdmin,
  targetId,
  targetType,
  onDelete,
  onTogglePin,
  onReplyPosted,
}: {
  comment: CommentType
  currentUserId?: string
  isAdmin?: boolean
  targetId: string
  targetType: 'movie' | 'series' | 'episode'
  onDelete: (id: string) => void
  onTogglePin: (id: string, pinned: boolean) => void
  onReplyPosted: (commentId: string, reply: ReplyType) => void
}) {
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [showReplies, setShowReplies] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  async function handleReplySubmit(body: string) {
    if (!currentUserId) {
      router.push('/login')
      return
    }
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [`${targetType}Id`]: targetId, parentId: comment.id, body }),
    })
    if (res.ok) {
      const newReply: ReplyType = await res.json()
      onReplyPosted(comment.id, newReply)
      setShowReplyInput(false)
    } else {
      toast({ title: 'Error', description: 'Failed to post reply', variant: 'destructive' })
    }
  }

  return (
    <div
      className={cn(
        'group rounded-xl px-4 py-4 border transition-colors',
        comment.isPinned
          ? 'bg-[#E50914]/[0.05] border-[#E50914]/20'
          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10'
      )}
    >
      {/* Comment header + body */}
      <div className="flex gap-3">
        <UserAvatar name={comment.user.name} avatarUrl={comment.user.avatarUrl} size={10} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-white text-sm">{comment.user.name || 'Anonymous User'}</span>
            <span className="text-white/35 text-xs">
              {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            {comment.isPinned && (
              <span className="flex items-center gap-1 text-[#E50914] text-[11px] font-semibold">
                <Pin className="w-3 h-3 fill-current" /> Pinned
              </span>
            )}
          </div>
          <p className="text-white/80 text-sm whitespace-pre-wrap break-words leading-relaxed">{comment.body}</p>

          {/* Action row */}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {currentUserId && (
              <button
                onClick={() => setShowReplyInput((v) => !v)}
                className="text-white/40 hover:text-white/80 text-xs flex items-center gap-1 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Reply
              </button>
            )}
            {(isAdmin || currentUserId === comment.userId) && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-white/30 hover:text-red-500 text-xs flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => onTogglePin(comment.id, comment.isPinned)}
                className="text-white/30 hover:text-white/70 text-xs flex items-center gap-1 transition-colors"
              >
                <Pin className="w-3.5 h-3.5" /> {comment.isPinned ? 'Unpin' : 'Pin'}
              </button>
            )}
          </div>

          {/* Inline reply input */}
          {showReplyInput && (
            <ReplyInput
              onSubmit={handleReplySubmit}
              onCancel={() => setShowReplyInput(false)}
            />
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="mt-4 ml-[52px]">
          <button
            onClick={() => setShowReplies((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mb-3"
          >
            <CornerDownRight className="w-3.5 h-3.5" />
            {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            <ChevronDown className={cn('w-3 h-3 transition-transform', showReplies && 'rotate-180')} />
          </button>
          {showReplies && (
            <div className="space-y-4 pl-1 border-l border-white/[0.06]">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="pl-3">
                  <ReplyItem
                    reply={reply}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    onDelete={onDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── CommentsSection (main export) ────────────────────────────────────────────

const PAGE_SIZE = 10

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
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const fetchPage = useCallback(
    async (pageNum: number, append = false) => {
      try {
        const res = await fetch(
          `/api/comments?${targetType}Id=${targetId}&page=${pageNum}&limit=${PAGE_SIZE}`
        )
        if (res.ok) {
          const data = await res.json()
          setComments((prev) =>
            append ? [...prev, ...data.comments] : data.comments
          )
          setTotalCount(data.totalCount)
          setHasMore(data.hasMore)
          setPage(pageNum)
        }
      } catch (err) {
        console.error(err)
      }
    },
    [targetId, targetType]
  )

  useEffect(() => {
    setLoading(true)
    fetchPage(1).finally(() => setLoading(false))
  }, [fetchPage])

  async function handleLoadMore() {
    setLoadingMore(true)
    await fetchPage(page + 1, true)
    setLoadingMore(false)
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
        const comment: CommentType = { ...(await res.json()), replies: [] }
        setComments((prev) => [comment, ...prev])
        setTotalCount((c) => c + 1)
        setNewComment('')
      } else {
        toast({ title: 'Error', description: 'Failed to post comment', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to post comment', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm('Are you sure you want to delete this comment?')) return

    // Optimistic: remove from top-level OR from replies
    setComments((prev) => {
      const withoutTop = prev.filter((c) => c.id !== commentId)
      if (withoutTop.length < prev.length) {
        setTotalCount((c) => c - 1)
        return withoutTop
      }
      return prev.map((c) => ({
        ...c,
        replies: c.replies.filter((r) => r.id !== commentId),
      }))
    })

    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
    } catch {
      toast({ title: 'Error', description: 'Failed to delete comment', variant: 'destructive' })
      fetchPage(1)
    }
  }

  async function handleTogglePin(commentId: string, currentPinned: boolean) {
    if (!isAdmin) return
    setComments((prev) => {
      const updated = prev.map((c) =>
        c.id === commentId ? { ...c, isPinned: !currentPinned } : c
      )
      return updated.sort((a, b) => {
        if (a.isPinned === b.isPinned)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        return a.isPinned ? -1 : 1
      })
    })
    try {
      const res = await fetch(`/api/comments/${commentId}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !currentPinned }),
      })
      if (!res.ok) throw new Error('Failed to pin')
    } catch {
      toast({ title: 'Error', description: 'Failed to update pin status', variant: 'destructive' })
      fetchPage(1)
    }
  }

  function handleReplyPosted(parentId: string, reply: ReplyType) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c
      )
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 py-8 border-t border-white/[0.08]">
      {/* Header */}
      <div className="flex items-baseline gap-3 mb-8">
        <h2 className="text-xl font-bold text-white">Comments</h2>
        {!loading && (
          <span className="text-sm text-white/40 font-normal">{totalCount} {totalCount === 1 ? 'comment' : 'comments'}</span>
        )}
      </div>

      {/* New comment form */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="flex gap-4 mb-10">
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#E50914]/50 focus:ring-1 focus:ring-[#E50914]/20 transition-all resize-none h-24 text-sm"
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-white/25 text-xs">{newComment.length}/500</span>
              <Button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="bg-[#E50914] hover:bg-[#b80710] text-white gap-2 transition-all"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Post Comment
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-10 p-5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-center">
          <p className="text-white/50 mb-4 text-sm">Sign in to join the conversation.</p>
          <Button onClick={() => router.push('/login')} className="bg-white text-black hover:bg-white/90 font-semibold">
            Log In
          </Button>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
        </div>
      ) : comments.length > 0 ? (
        <>
          <div className="space-y-3">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                targetId={targetId}
                targetType={targetType}
                onDelete={handleDelete}
                onTogglePin={handleTogglePin}
                onReplyPosted={handleReplyPosted}
              />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                className="border-white/10 text-white/70 hover:bg-white/[0.06] hover:text-white hover:border-white/20 transition-all gap-2 px-8"
              >
                {loadingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                Load more comments
              </Button>
            </div>
          )}

          {!hasMore && comments.length > PAGE_SIZE && (
            <p className="text-center text-white/25 text-xs mt-8">All {totalCount} comments loaded</p>
          )}
        </>
      ) : (
        <div className="text-center py-16 space-y-2">
          <MessageSquare className="w-10 h-10 text-white/10 mx-auto" />
          <p className="text-white/35 text-sm">No comments yet. Be the first to share your thoughts!</p>
        </div>
      )}
    </div>
  )
}
