'use client'

import { useApp, BrandProfile } from '@/app/providers'
import { BRAND_PROFILES } from '@/app/providers'
import { useState, useEffect } from 'react'

export default function Sidebar({ onToggle }: { onToggle?: (open: boolean) => void }) {
  const { activeProfile, setActiveProfile } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    onToggle?.(mobileOpen)
  }, [mobileOpen, onToggle])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const selectProfile = (profile: BrandProfile) => {
    setActiveProfile(profile)
    setMobileOpen(false)
  }

  const openSidebar = () => setMobileOpen(true)
  const closeSidebar = () => setMobileOpen(false)

  // Expose open function globally for the hamburger button
  if (typeof window !== 'undefined') {
    ;(window as unknown as Record<string, unknown>).__openSidebar = openSidebar
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed md:relative z-50 h-full bg-brand-card border-r border-brand-border
          transition-transform duration-300 ease-in-out flex flex-col
          w-64
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Logo / Header */}
        <div className="flex items-center justify-between p-4 border-b border-brand-border shrink-0">
          <span className="font-bold text-lg tracking-tight">
            Content<span className="text-brand-accent">Studio</span>
          </span>
          <button
            onClick={closeSidebar}
            className="p-2 rounded-lg hover:bg-brand-border transition-colors md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Profiles list */}
        <div className="flex-1 overflow-y-auto py-3">
          <p className="px-4 text-[10px] font-semibold uppercase tracking-wider text-brand-muted mb-2">
            Brands
          </p>
          {BRAND_PROFILES.map((profile: BrandProfile) => {
            const isActive = activeProfile.id === profile.id
            return (
              <button
                key={profile.id}
                onClick={() => selectProfile(profile)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 min-h-[56px] transition-all
                  ${isActive
                    ? 'bg-brand-accent/10 text-brand-accent border-r-2 border-brand-accent'
                    : 'text-brand-muted hover:text-brand-text hover:bg-brand-border/50'
                  }
                `}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ backgroundColor: profile.colors.primary + '30', color: profile.colors.primary }}
                >
                  {profile.name.charAt(0)}
                </div>
                <div className="text-left min-w-0">
                  <p className="font-medium text-sm truncate">{profile.name}</p>
                  <p className="text-[11px] text-brand-muted truncate">
                    {profile.enabledPlatforms.length} platform{profile.enabledPlatforms.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* History link */}
        <div className="border-t border-brand-border pt-3 pb-2">
          <a
            href="/history"
            className="w-full flex items-center gap-3 px-4 py-3 min-h-[48px] text-brand-muted hover:text-brand-text hover:bg-brand-border/50 rounded-lg transition-all"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-sm">History</span>
          </a>
        </div>

        {/* Bottom */}
        <div className="p-4 border-t border-brand-border shrink-0">
          <p className="text-[10px] text-brand-muted">v1.0.0 · Live</p>
        </div>
      </aside>
    </>
  )
}
