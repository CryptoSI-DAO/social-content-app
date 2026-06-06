'use client'

import { useApp, Platform, ContentPost, BrandProfile } from '@/app/providers'
import { BRAND_PROFILES } from '@/app/providers'

const PLATFORM_META: Record<Platform, { label: string; icon: string; color: string }> = {
  twitter: { label: 'X / Twitter', icon: '𝕏', color: '#000000' },
  instagram: { label: 'Instagram', icon: '📷', color: '#E4405F' },
  facebook: { label: 'Facebook', icon: 'f', color: '#1877F2' },
  linkedin: { label: 'LinkedIn', icon: 'in', color: '#0A66C2' },
}

export default function BottomNav() {
  const { activePlatform, setActivePlatform, activeProfile } = useApp()
  const enabledPlatforms = activeProfile.enabledPlatforms

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-brand-card border-t border-brand-border z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {enabledPlatforms.map((platform) => {
          const meta = PLATFORM_META[platform]
          const isActive = activePlatform === platform
          return (
            <button
              key={platform}
              onClick={() => setActivePlatform(platform)}
              className={`flex flex-col items-center justify-center flex-1 py-2 rounded-lg transition-all ${
                isActive
                  ? 'text-brand-accent bg-brand-accent/10'
                  : 'text-brand-muted hover:text-brand-text'
              }`}
            >
              <span className="text-lg leading-none mb-1">{meta.icon}</span>
              <span className="text-[10px] font-medium">{meta.label.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
