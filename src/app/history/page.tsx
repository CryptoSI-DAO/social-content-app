'use client'

import { useApp, ContentPost, BrandProfile } from '@/app/providers'
import { fetchPostHistory, deletePost } from '@/lib/content'
import HistoryCard from '@/components/HistoryCard'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const PAGE_SIZE = 10

export default function HistoryPage() {
  const { supabase, user, activeProfile, signOut, loading } = useApp()
  const [posts, setPosts] = useState<ContentPost[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [page, setPage] = useState(0)
  const [filterProfile, setFilterProfile] = useState<string>('all')

  const loadHistory = useCallback(async () => {
    if (!supabase || !user) return
    setLoadingHistory(true)
    const history = await fetchPostHistory(supabase, activeProfile.id, user.id, 100)
    setPosts(history)
    setLoadingHistory(false)
  }, [supabase, user, activeProfile.id])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleDelete = async (id: string) => {
    const success = await deletePost(supabase, id)
    if (success) {
      setPosts(posts.filter((p) => p.id !== id))
    }
  }

  const handleOpenSidebar = useCallback(() => {
    const fn = (window as unknown as Record<string, unknown>).__openSidebar as (() => void) | undefined
    fn?.()
  }, [])

  if (loading || loadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-brand-muted text-sm">Loading history…</p>
        </div>
      </div>
    )
  }

  const paginated = posts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(posts.length / PAGE_SIZE)

  return (
    <div className="flex flex-col items-center min-h-full px-3 py-4 sm:p-6 md:p-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            {/* Back button */}
            <Link
              href="/"
              className="p-2.5 rounded-lg bg-brand-card border border-brand-border hover:border-brand-accent transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Back to dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-bold">Content History</h1>
              <p className="text-brand-muted text-xs">
                {posts.length} post{posts.length !== 1 ? 's' : ''} for {activeProfile.name}
              </p>
            </div>
          </div>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="bg-brand-card border border-brand-border rounded-xl p-8 text-center">
            <p className="text-brand-muted text-sm mb-1">No history yet</p>
            <p className="text-brand-muted text-xs">
              Generated posts will appear here after they expire.
            </p>
            <Link
              href="/"
              className="inline-block mt-4 px-4 py-2.5 rounded-xl text-sm font-medium border border-brand-border hover:border-brand-accent transition-all"
            >
              ← Back to Dashboard
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginated.map((post) => (
                <HistoryCard
                  key={post.id}
                  post={post}
                  profile={activeProfile}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-2 rounded-lg text-sm border border-brand-border hover:border-brand-accent disabled:opacity-30 transition-all min-h-[40px]"
                >
                  ← Prev
                </button>
                <span className="text-xs text-brand-muted px-3">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-2 rounded-lg text-sm border border-brand-border hover:border-brand-accent disabled:opacity-30 transition-all min-h-[40px]"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
