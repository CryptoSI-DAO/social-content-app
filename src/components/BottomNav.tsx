'use client'

import { useApp, Platform } from '@/app/providers'

const PLATFORM_META: Record<Platform, { label: string; shortLabel: string; icon: string; color: string }> = {
  twitter:  { label: 'X / Twitter', shortLabel: 'X',     icon: '𝕏', color: '#000000' },
  instagram: { label: 'Instagram',  shortLabel: 'IG',    icon: '📷', color: '#E4405F' },
  facebook:  { label: 'Facebook',   shortLabel: 'FB',    icon: 'f',  color: '#1877F2' },
  linkedin:  { label: 'LinkedIn',   shortLabel: 'LI',    icon: 'in', color: '#0A66C2' },
}

export default function BottomNav() {
  const { activePlatform, setActivePlatform, activeProfile } = useApp()
  const enabledPlatforms = activeProfile.enabledPlatforms

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-brand-card/95 backdrop-blur-md border-t border-brand-border z-40 md:hidden">
      <div className="flex justify-around items-center h-16 px-1 pb-[env(safe-area-inset-bottom)]">
        {enabledPlatforms.map((platform) => {
          const meta = PLATFORM_META[platform]
          const isActive = activePlatform === platform
          return (
            <button
              key={platform}
              onClick={() => setActivePlatform(platform)}
              className={`
                flex flex-col items-center justify-center flex-1 min-h-[56px] py-1.5 px-1 rounded-xl transition-all
                ${isActive
                  ? 'text-brand-accent bg-brand-accent/10'
                  : 'text-brand-muted active:bg-brand-border/50'
                }
              `}
            >
              <span className="text-xl leading-none mb-0.5">{meta.icon}</span>
              <span className="text-[10px] font-semibold tracking-wide">{meta.shortLabel}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
