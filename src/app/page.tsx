'use client'

import { useApp } from '@/app/providers'
import ContentCard from '@/components/ContentCard'
import SettingsPanel from '@/components/SettingsPanel'
import { useState, useCallback } from 'react'

export default function HomePage() {
  const { currentPost, activeProfile, activePlatform, refreshContent } = useApp()
  const [showSettings, setShowSettings] = useState(false)

  const handleOpenSidebar = useCallback(() => {
    const fn = (window as unknown as Record<string, unknown>).__openSidebar as (() => void) | undefined
    fn?.()
  }, [])

  if (showSettings) {
    return <SettingsPanel onClose={() => setShowSettings(false)} />
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-3 py-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="w-full max-w-lg mb-4 sm:mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            onClick={handleOpenSidebar}
            className="p-2.5 rounded-lg bg-brand-card border border-brand-border hover:border-brand-accent transition-colors md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center -ml-1"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Brand avatar — mobile */}
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold md:hidden"
            style={{ backgroundColor: activeProfile.colors.primary + '25', color: activeProfile.colors.primary }}
          >
            {activeProfile.name.charAt(0)}
          </div>

          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold leading-tight">{activeProfile.name}</h1>
            <p className="text-brand-muted text-xs sm:text-sm capitalize">{activePlatform} content</p>
          </div>
        </div>

        {/* Settings button */}
        <button
          onClick={() => setShowSettings(true)}
          className="p-2.5 rounded-lg bg-brand-card border border-brand-border hover:border-brand-accent transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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

      {/* Platform tips */}
      <div className="w-full max-w-lg mt-3 sm:mt-4">
        <PlatformTips platform={activePlatform} />
      </div>
    </div>
  )
}

function PlatformTips({ platform }: { platform: string }) {
  const tips: Record<string, string> = {
    twitter: '280 chars · 1-2 hashtags · Best times: 9am, 12pm, 5pm EST',
    instagram: '2,200 chars · 5-10 hashtags · Square or 4:5 ratio',
    facebook: '63K chars · 0-2 hashtags · 1200×630px images',
    linkedin: '3,000 chars · 3-5 hashtags · Professional tone',
  }
  return (
    <p className="text-brand-muted text-[10px] sm:text-xs text-center leading-relaxed">
      {tips[platform] || ''}
    </p>
  )
}
