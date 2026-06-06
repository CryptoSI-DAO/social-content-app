'use client'

import { ContentPost, BrandProfile, Platform } from '@/app/providers'
import { useState } from 'react'

const PLATFORM_LIMITS: Record<Platform, { chars: string; imageRatio: string; aspectClass: string }> = {
  twitter:   { chars: '280',    imageRatio: '16:9',      aspectClass: 'aspect-video' },
  instagram: { chars: '2,200',  imageRatio: '1:1 / 4:5', aspectClass: 'aspect-square' },
  facebook:  { chars: '63K',    imageRatio: '1.91:1',    aspectClass: 'aspect-video' },
  linkedin:  { chars: '3,000',  imageRatio: '1.91:1',    aspectClass: 'aspect-video' },
}

interface Props {
  post: ContentPost | null
  profile: BrandProfile
  platform: Platform
  onRefresh: () => void
}

export default function ContentCard({ post, profile, platform, onRefresh }: Props) {
  const [copied, setCopied] = useState(false)
  const limits = PLATFORM_LIMITS[platform]

  const handleCopy = async () => {
    if (!post?.caption) return
    try {
      await navigator.clipboard.writeText(post.caption)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text
      const ta = document.createElement('textarea')
      ta.value = post.caption
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // ── Placeholder state ──────────────────────────────────────────
  if (!post) {
    return (
      <div className="w-full max-w-lg bg-brand-card border border-brand-border rounded-2xl overflow-hidden mx-auto">
        {/* Image placeholder */}
        <div
          className={`w-full ${limits.aspectClass} flex items-center justify-center`}
          style={{ backgroundColor: profile.colors.primary + '10' }}
        >
          <div className="text-center p-6 sm:p-8">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mx-auto mb-3 sm:mb-4 flex items-center justify-center text-xl sm:text-2xl font-bold"
              style={{ backgroundColor: profile.colors.primary + '25', color: profile.colors.primary }}
            >
              {profile.name.charAt(0)}
            </div>
            <p className="text-brand-muted text-sm font-medium">No content generated yet</p>
            <p className="text-brand-muted text-xs mt-1">Tap the button below to generate today's post</p>
          </div>
        </div>

        {/* Caption placeholder */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: profile.colors.primary }}
              />
              <span className="text-xs font-medium text-brand-muted capitalize">{platform}</span>
            </div>
            <span className="text-[10px] text-brand-muted">
              {limits.imageRatio} • {limits.chars} chars
            </span>
          </div>

          <p className="text-brand-muted text-sm italic leading-relaxed">
            Caption will appear here after generation…
          </p>

          <button
            onClick={onRefresh}
            className="w-full mt-4 py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
            style={{ backgroundColor: profile.colors.primary, color: '#fff' }}
          >
            ✨ Generate Content
          </button>
        </div>
      </div>
    )
  }

  // ── Content exists ─────────────────────────────────────────────
  return (
    <div className="w-full max-w-lg bg-brand-card border border-brand-border rounded-2xl overflow-hidden mx-auto">
      {/* Generated image */}
      <div className={`relative w-full ${limits.aspectClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.imageUrl}
          alt={`${profile.name} ${platform} post`}
          className="w-full h-full object-cover"
        />
        {/* Platform badge */}
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
          <span className="text-[11px] font-medium text-white capitalize">{platform}</span>
        </div>
        {/* Expiry badge */}
        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
          <span className="text-[10px] text-white/80">
            ⏰ {new Date(post.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Caption area */}
      <div className="p-4 sm:p-5">
        {/* Meta row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: profile.colors.primary }}
            />
            <span className="text-xs font-medium text-brand-muted">
              {profile.name} · <span className="capitalize">{platform}</span>
            </span>
          </div>
          <span className="text-[10px] text-brand-muted tabular-nums">
            {post.caption.length.toLocaleString()}/{PLATFORM_LIMITS[platform].chars.split(' ')[0]}
          </span>
        </div>

        {/* Caption text */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {post.caption}
        </p>

        {/* Hashtags */}
        {profile.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {profile.hashtags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: profile.colors.primary + '18', color: profile.colors.primary }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleCopy}
            className="flex-1 py-3 rounded-xl text-sm font-medium border border-brand-border hover:border-brand-accent active:bg-brand-border/50 transition-all min-h-[48px]"
          >
            {copied ? '✓ Copied!' : '📋 Copy Caption'}
          </button>
          <button
            onClick={onRefresh}
            className="px-4 py-3 rounded-xl text-sm font-medium border border-brand-border hover:border-brand-accent active:bg-brand-border/50 transition-all min-h-[48px]"
            aria-label="Regenerate"
          >
            🔄
          </button>
        </div>
      </div>
    </div>
  )
}
