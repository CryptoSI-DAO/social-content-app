'use client'

import { useApp, BrandProfile } from '@/app/providers'
import { BRAND_PROFILES } from '@/app/providers'
import { useState } from 'react'

export default function Sidebar() {
  const { activeProfile, setActiveProfile } = useApp()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-50 h-full bg-brand-card border-r border-brand-border transition-all duration-300 flex flex-col ${
          collapsed ? '-translate-x-full md:translate-x-0 md:w-16' : 'w-64'
        }`}
      >
        {/* Logo / Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-brand-border">
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight">
              Content<span className="text-brand-accent">Studio</span>
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-brand-border transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>

        {/* Profiles list */}
        <div className="flex-1 overflow-y-auto py-3">
          {!collapsed && (
            <p className="px-4 text-[10px] font-semibold uppercase tracking-wider text-brand-muted mb-2">
              Brands
            </p>
          )}
          {BRAND_PROFILES.map((profile: BrandProfile) => {
            const isActive = activeProfile.id === profile.id
            return (
              <button
                key={profile.id}
                onClick={() => {
                  setActiveProfile(profile)
                  setCollapsed(true) // auto-close on mobile after selection
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                  isActive
                    ? 'bg-brand-accent/10 text-brand-accent border-r-2 border-brand-accent'
                    : 'text-brand-muted hover:text-brand-text hover:bg-brand-border/50'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? profile.name : undefined}
              >
                {/* Brand avatar placeholder */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ backgroundColor: profile.colors.primary + '30', color: profile.colors.primary }}
                >
                  {profile.name.charAt(0)}
                </div>
                {!collapsed && (
                  <div className="text-left min-w-0">
                    <p className="font-medium text-sm truncate">{profile.name}</p>
                    <p className="text-[10px] text-brand-muted truncate">
                      {profile.enabledPlatforms.length} platforms
                    </p>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Bottom section */}
        {!collapsed && (
          <div className="p-4 border-t border-brand-border">
            <p className="text-[10px] text-brand-muted">
              v0.1.0 • Scaffolding
            </p>
          </div>
        )}
      </aside>
    </>
  )
}
