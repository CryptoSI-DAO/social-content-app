'use client'

import { useApp } from '@/app/providers'
import ContentCard from '@/components/ContentCard'
import SettingsPanel from '@/components/SettingsPanel'
import { useState } from 'react'

export default function HomePage() {
  const { currentPost, activeProfile, activePlatform, refreshContent } = useApp()
  const [showSettings, setShowSettings] = useState(false)

  if (showSettings) {
    return <SettingsPanel onClose={() => setShowSettings(false)} />
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4 md:p-8">
      {/* Header */}
      <div className="w-full max-w-lg mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{activeProfile.name}</h1>
          <p className="text-brand-muted text-sm capitalize">{activePlatform} content</p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg bg-brand-card border border-brand-border hover:border-brand-accent transition-colors"
          aria-label="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Main Content Card */}
      <ContentCard
        post={currentPost}
        profile={activeProfile}
        platform={activePlatform}
        onRefresh={refreshContent}
      />

      {/* Platform-specific tips */}
      <div className="w-full max-w-lg mt-4">
        <PlatformTips platform={activePlatform} />
      </div>
    </div>
  )
}

function PlatformTips({ platform }: { platform: string }) {
  const tips: Record<string, string> = {
    twitter: '280 chars • 1-2 hashtags • Best times: 9am, 12pm, 5pm EST',
    instagram: '2,200 chars • 5-10 hashtags • Square or 4:5 ratio images',
    facebook: '63,206 chars • 0-2 hashtags • 1200x630px images',
    linkedin: '3,000 chars • 3-5 hashtags • Professional tone, 1200x627px',
  }
  return (
    <p className="text-brand-muted text-xs text-center">
      {tips[platform] || ''}
    </p>
  )
}
