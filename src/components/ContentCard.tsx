'use client'

import { ContentPost, BrandProfile, Platform } from '@/app/providers'
import { useState } from 'react'

const PLATFORM_LIMITS: Record<Platform, { chars: string; imageRatio: string }> = {
  twitter: { chars: '280', imageRatio: '16:9' },
  instagram: { chars: '2,200', imageRatio: '1:1 / 4:5' },
  facebook: { chars: '63K', imageRatio: '1.91:1' },
  linkedin: { chars: '3,000', imageRatio: '1.91:1' },
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
    await navigator.clipboard.writeText(post.caption)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Placeholder state — no content generated yet
  if (!post) {
    return (
      <div className="w-full max-w-lg bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
        {/* Image placeholder */}
        <div
          className="w-full aspect-video flex items-center justify-center"
          style={{ backgroundColor: profile.colors.primary + '15' }}
        >
          <div className="text-center p-8">
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-bold"
              style={{ backgroundColor: profile.colors.primary + '30', color: profile.colors.primary }}
            >
              {profile.name.charAt(0)}
            </div>
            <p className="text-brand-muted text-sm">No content generated yet</p>
            <p className="text-brand-muted text-xs mt-1">Tap refresh to generate today's post</p>
          </div>
        </div>

        {/* Caption placeholder */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: profile.colors.primary }}
              />
              <span className="text-xs font-medium text-brand-muted capitalize">{platform}</span>
            </div>
            <span className="text-[10px] text-brand-muted">
              Image ratio: {limits.imageRatio} • {limits.chars} chars
            </span>
          </div>

          <p className="text-brand-muted text-sm italic">
            Caption will appear here after generation...
          </p>

          <button
            onClick={onRefresh}
            className="w-full mt-4 py-3 rounded-xl font-medium text-sm transition-all"
            style={{ backgroundColor: profile.colors.primary, color: '#fff' }}
          >
            ✨ Generate Content
          </button>
        </div>
      </div>
    )
  }

  // Content exists
  return (
    <div className="w-full max-w-lg bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
      {/* Generated image */}
      <div className="relative w-full aspect-video">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.imageUrl}
          alt={`${profile.name} ${platform} post`}
          className="w-full h-full object-cover"
        />
        {/* Platform badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
          <span className="text-xs font-medium text-white capitalize">{platform}</span>
        </div>
        {/* Time remaining */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
          <span className="text-[10px] text-white/80">
            Expires: {new Date(post.expiresAt).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Caption */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: profile.colors.primary }}
            />
            <span className="text-xs font-medium text-brand-muted">
              {profile.name} • {platform}
            </span>
          </div>
          <span className="text-[10px] text-brand-muted">
            {post.caption.length}/{PLATFORM_LIMITS[platform].chars.split(' ')[0]} chars
          </span>
        </div>

        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {post.caption}
        </p>

        {/* Hashtags */}
        {profile.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {profile.hashtags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 rounded-full"
                style={{ backgroundColor: profile.colors.primary + '20', color: profile.colors.primary }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-brand-border hover:border-brand-accent transition-colors"
          >
            {copied ? '✓ Copied!' : '📋 Copy Caption'}
          </button>
          <button
            onClick={onRefresh}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border border-brand-border hover:border-brand-accent transition-colors"
            aria-label="Regenerate"
          >
            🔄
          </button>
        </div>
      </div>
    </div>
  )
}
