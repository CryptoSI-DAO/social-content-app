'use client'

import { useApp, Platform } from '@/app/providers'
import { BRAND_PROFILES } from '@/app/providers'
import { useState } from 'react'

const PLATFORM_META: Record<Platform, { label: string; icon: string; color: string }> = {
  twitter: { label: 'X / Twitter', icon: '𝕏', color: '#000000' },
  instagram: { label: 'Instagram', icon: '📷', color: '#E4405F' },
  facebook: { label: 'Facebook', icon: 'f', color: '#1877F2' },
  linkedin: { label: 'LinkedIn', icon: 'in', color: '#0A66C2' },
}

interface Props {
  onClose: () => void
}

export default function SettingsPanel({ onClose }: Props) {
  const { activeProfile } = useApp()
  const [platformToggles, setPlatformToggles] = useState<Record<Platform, boolean>>({
    twitter: activeProfile.enabledPlatforms.includes('twitter'),
    instagram: activeProfile.enabledPlatforms.includes('instagram'),
    facebook: activeProfile.enabledPlatforms.includes('facebook'),
    linkedin: activeProfile.enabledPlatforms.includes('linkedin'),
  })

  const togglePlatform = (platform: Platform) => {
    setPlatformToggles((prev) => ({ ...prev, [platform]: !prev[platform] }))
  }

  const handleSave = () => {
    // TODO: persist to Supabase
    console.log('Saving platform settings:', platformToggles)
    onClose()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4 md:p-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold">Settings</h2>
            <p className="text-brand-muted text-sm">Configure platforms for {activeProfile.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-brand-card border border-brand-border hover:border-brand-accent transition-colors"
            aria-label="Close settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Platform toggles */}
        <div className="space-y-3 mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3">
            Enabled Platforms
          </p>
          {(Object.keys(PLATFORM_META) as Platform[]).map((platform) => {
            const meta = PLATFORM_META[platform]
            const isEnabled = platformToggles[platform]
            return (
              <button
                key={platform}
                onClick={() => togglePlatform(platform)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  isEnabled
                    ? 'border-brand-accent bg-brand-accent/5'
                    : 'border-brand-border bg-brand-card'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{meta.icon}</span>
                  <div className="text-left">
                    <p className="font-medium text-sm">{meta.label}</p>
                    <p className="text-[11px] text-brand-muted">
                      {isEnabled ? 'Active' : 'Disabled'}
                    </p>
                  </div>
                </div>
                {/* Toggle switch */}
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    isEnabled ? 'bg-brand-accent' : 'bg-brand-border'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-5.5 left-0.5' : 'left-0.5'
                    }`}
                    style={{ transform: isEnabled ? 'translateX(22px)' : 'translateX(0)' }}
                  />
                </div>
              </button>
            )
          })}
        </div>

        {/* Brand info (read-only for now) */}
        <div className="bg-brand-card border border-brand-border rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3">
            Brand Profile
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-muted">Name</span>
              <span>{activeProfile.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Voice</span>
              <span className="text-right max-w-[60%] text-xs">{activeProfile.voice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Website</span>
              <span className="text-brand-accent text-xs">{activeProfile.website}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-brand-muted">Colors</span>
              <div className="flex gap-1.5">
                {Object.entries(activeProfile.colors).map(([key, color]) => (
                  <div
                    key={key}
                    className="w-5 h-5 rounded-full border border-brand-border"
                    style={{ backgroundColor: color }}
                    title={`${key}: ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-brand-muted mt-3 italic">
            Edit brand details coming soon
          </p>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-xl font-medium text-sm transition-all"
          style={{ backgroundColor: activeProfile.colors.primary, color: '#fff' }}
        >
          Save Settings
        </button>
      </div>
    </div>
  )
}
