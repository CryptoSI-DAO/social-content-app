'use client'

import { ContentPost, BrandProfile, Platform } from '@/app/providers'
import { useState, useEffect } from 'react'

const PLATFORM_LIMITS: Record<Platform, { chars: string; imageRatio: string; aspectClass: string }> = {
  twitter:   { chars: '280',    imageRatio: '16:9',      aspectClass: 'aspect-video' },
  instagram: { chars: '2,200',  imageRatio: '1:1 / 4:5', aspectClass: 'aspect-square' },
  facebook:  { chars: '63K',    imageRatio: '1.91:1',    aspectClass: 'aspect-video' },
  linkedin:  { chars: '3,000',  imageRatio: '1.91:1',    aspectClass: 'aspect-video' },
}

const SHARE_ICONS: Record<Platform, string> = {
  twitter: '𝕏',
  instagram: '📷',
  facebook: 'f',
  linkedin: 'in',
}

function buildShareUrl(platform: Platform, caption: string, website: string): string {
  const encodedCaption = encodeURIComponent(caption)
  const encodedUrl = encodeURIComponent(website || window.location.origin)

  switch (platform) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodedCaption}`
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedCaption}`
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    case 'instagram':
      // Instagram doesn't support web share URLs — copy caption instead
      return ''
    default:
      return ''
  }
}

interface Props {
  post: ContentPost | null
  profile: BrandProfile
  platform: Platform
  onRefresh: () => void
  generating?: boolean
  generatingStatus?: string
  selectedTopic?: string
}

export default function ContentCard({ post, profile, platform, onRefresh, generating, generatingStatus, selectedTopic }: Props) {
  const [copied, setCopied] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [expiryColor, setExpiryColor] = useState<'green' | 'yellow' | 'red'>('green')
  const limits = PLATFORM_LIMITS[platform]

  // Live countdown timer
  useEffect(() => {
    if (!post) return
    const update = () => {
      const ms = new Date(post.expiresAt).getTime() - Date.now()
      if (ms <= 0) {
        setTimeRemaining('Expired')
        setExpiryColor('red')
        return
      }
      const h = Math.floor(ms / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      setTimeRemaining(`${h}h ${m}m left`)
      setExpiryColor(h > 12 ? 'green' : h > 2 ? 'yellow' : 'red')
    }
    update()
    const interval = setInterval(update, 30000)
    return () => clearInterval(interval)
  }, [post])

  const handleCopy = async () => {
    if (!post?.caption) return
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

  const handleShare = (platform: Platform) => {
    if (!post?.caption) return

    // Try Web Share API first (mobile)
    if (navigator.share) {
      navigator.share({
        title: profile.name,
        text: post.caption,
        url: profile.website || undefined,
      }).catch(() => {})
      return
    }

    // Fall back to platform-specific share URL
    const url = buildShareUrl(platform, post.caption, profile.website)
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500')
    } else {
      // Instagram — just copy the caption
      handleCopy()
    }
  }

  const handleDownload = async () => {
    if (!post?.imageUrl) return
    try {
      const res = await fetch(post.imageUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${profile.slug}-${platform}-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // Fallback — open in new tab
      window.open(post.imageUrl, '_blank')
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
            {generating ? (
              <>
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-brand-accent/30 border-t-brand-accent animate-spin mx-auto mb-4" />
                <p className="text-brand-muted text-sm font-medium">{generatingStatus || 'Generating...'}</p>
                <p className="text-brand-muted text-xs mt-1">This takes ~60-90 seconds</p>
              </>
            ) : (
              <>
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mx-auto mb-3 sm:mb-4 flex items-center justify-center text-xl sm:text-2xl font-bold"
                  style={{ backgroundColor: profile.colors.primary + '25', color: profile.colors.primary }}
                >
                  {profile.name.charAt(0)}
                </div>
                <p className="text-brand-muted text-sm font-medium">No content generated yet</p>
                <p className="text-brand-muted text-xs mt-1">Tap the button below to generate today's post</p>
              </>
            )}
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
            disabled={generating}
            className="w-full mt-4 py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: profile.colors.primary, color: '#fff' }}
          >
            {generating ? (generatingStatus || 'Generating...') : selectedTopic ? `✨ Generate about "${selectedTopic.slice(0, 30)}"` : '✨ Generate Content'}
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
        {/* Expiry badge — color coded */}
        <div
          className={`absolute top-2.5 right-2.5 sm:top-3 sm:right-3 px-2.5 py-1 rounded-full backdrop-blur-sm ${
            expiryColor === 'green' ? 'bg-black/60' : ''
          } ${expiryColor === 'yellow' ? 'bg-yellow-500/80' : ''} ${expiryColor === 'red' ? 'bg-red-500/80' : ''}`}
        >
          <span className={`text-[10px] font-medium ${expiryColor === 'green' ? 'text-white/80' : 'text-white'}`}>
            ⏰ {timeRemaining || `${new Date(post.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
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

        {/* Share buttons row */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleCopy}
            className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all min-h-[48px] ${
              copied
                ? 'border-green-500/50 bg-green-500/10 text-green-400'
                : 'border-brand-border hover:border-brand-accent active:bg-brand-border/50'
            }`}
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>

          {/* Platform share buttons */}
          {profile.enabledPlatforms.map((p) => (
            <button
              key={p}
              onClick={() => handleShare(p)}
              className="px-3 py-3 rounded-xl text-sm font-medium border border-brand-border hover:border-brand-accent active:bg-brand-border/50 transition-all min-h-[48px] flex items-center justify-center"
              aria-label={`Share to ${p}`}
              title={`Share to ${p}`}
            >
              {SHARE_ICONS[p]}
            </button>
          ))}

          {/* Image download */}
          <button
            onClick={handleDownload}
            className="px-3 py-3 rounded-xl text-sm font-medium border border-brand-border hover:border-brand-accent active:bg-brand-border/50 transition-all min-h-[48px] flex items-center justify-center"
            aria-label="Download image"
            title="Download image"
          >
            ⬇️
          </button>

          {/* Regenerate */}
          <button
            onClick={onRefresh}
            className="px-4 py-3 rounded-xl text-sm font-medium border border-brand-border hover:border-brand-accent active:bg-brand-border/50 transition-all min-h-[48px] flex items-center justify-center"
            aria-label="Regenerate"
            title="Regenerate content"
          >
            🔄
          </button>
        </div>
      </div>
    </div>
  )
}
