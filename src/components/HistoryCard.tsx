'use client'

import { ContentPost, BrandProfile, Platform } from '@/app/providers'
import { useState } from 'react'

const PLATFORM_ICONS: Record<Platform, string> = {
  twitter: '𝕏',
  instagram: '📷',
  facebook: 'f',
  linkedin: 'in',
}

interface Props {
  post: ContentPost
  profile: BrandProfile
  onDelete?: (id: string) => void
}

export default function HistoryCard({ post, profile, onDelete }: Props) {
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const isExpired = new Date(post.expiresAt) < new Date()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(post.caption)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = post.caption
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: profile.name, text: post.caption }).catch(() => {})
    } else {
      handleCopy()
    }
  }

  const dateStr = new Date(post.generatedAt).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="flex gap-3 bg-brand-card border border-brand-border rounded-xl p-3 hover:border-brand-border/80 transition-colors">
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-brand-dark">
        {post.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-muted text-xs">
            No img
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{PLATFORM_ICONS[post.platform]}</span>
          <span className="text-[10px] text-brand-muted capitalize">{post.platform}</span>
          <span className="text-[10px] text-brand-muted">·</span>
          <span className="text-[10px] text-brand-muted">{dateStr}</span>
          {isExpired && (
            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">
              Expired
            </span>
          )}
        </div>
        <p className="text-xs text-brand-text/80 line-clamp-2 leading-relaxed">
          {post.caption}
        </p>
        {/* Actions */}
        <div className="flex gap-1.5 mt-2">
          <button
            onClick={handleCopy}
            className={`text-[10px] px-2 py-1 rounded-md font-medium transition-colors ${
              copied
                ? 'text-green-400 bg-green-500/10'
                : 'text-brand-muted hover:text-brand-text bg-brand-dark'
            }`}
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
          <button
            onClick={handleShare}
            className="text-[10px] px-2 py-1 rounded-md font-medium text-brand-muted hover:text-brand-text bg-brand-dark transition-colors"
          >
            ↗ Share
          </button>
          {onDelete && (
            <button
              onClick={() => {
                if (confirming) {
                  onDelete(post.id)
                } else {
                  setConfirming(true)
                  setTimeout(() => setConfirming(false), 3000)
                }
              }}
              className={`text-[10px] px-2 py-1 rounded-md font-medium transition-colors ${
                confirming
                  ? 'text-white bg-red-500'
                  : 'text-brand-muted hover:text-red-400 bg-brand-dark'
              }`}
            >
              {confirming ? 'Confirm?' : '🗑 Delete'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
