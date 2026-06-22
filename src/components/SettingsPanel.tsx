'use client'

import { useApp, Platform, BrandProfile } from '@/app/providers'
import { updateProfile, createProfile } from '@/lib/content'
import { useState, useEffect } from 'react'

const PLATFORM_META: Record<Platform, { label: string; icon: string; color: string }> = {
  twitter:   { label: 'X / Twitter', icon: '𝕏', color: '#000000' },
  instagram: { label: 'Instagram',  icon: '📷', color: '#E4405F' },
  facebook:  { label: 'Facebook',   icon: 'f',  color: '#1877F2' },
  linkedin:  { label: 'LinkedIn',   icon: 'in', color: '#0A66C2' },
}

interface Props {
  onClose: () => void
}

export default function SettingsPanel({ onClose }: Props) {
  const { activeProfile, setActiveProfile, supabase, user, signOut } = useApp()

  // Local editable state
  const [name, setName] = useState(activeProfile.name)
  const [description, setDescription] = useState(activeProfile.description)
  const [voice, setVoice] = useState(activeProfile.voice)
  const [website, setWebsite] = useState(activeProfile.website)
  const [colors, setColors] = useState(activeProfile.colors)
  const [hashtags, setHashtags] = useState<string[]>(activeProfile.hashtags)
  const [newTag, setNewTag] = useState('')
  const [platformToggles, setPlatformToggles] = useState<Record<Platform, boolean>>({
    twitter:   activeProfile.enabledPlatforms.includes('twitter'),
    instagram: activeProfile.enabledPlatforms.includes('instagram'),
    facebook:  activeProfile.enabledPlatforms.includes('facebook'),
    linkedin:  activeProfile.enabledPlatforms.includes('linkedin'),
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [showAddBrand, setShowAddBrand] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')

  // Sync state when active profile changes
  useEffect(() => {
    setName(activeProfile.name)
    setDescription(activeProfile.description)
    setVoice(activeProfile.voice)
    setWebsite(activeProfile.website)
    setColors(activeProfile.colors)
    setHashtags(activeProfile.hashtags)
    setPlatformToggles({
      twitter:   activeProfile.enabledPlatforms.includes('twitter'),
      instagram: activeProfile.enabledPlatforms.includes('instagram'),
      facebook:  activeProfile.enabledPlatforms.includes('facebook'),
      linkedin:  activeProfile.enabledPlatforms.includes('linkedin'),
    })
  }, [activeProfile])

  const togglePlatform = (platform: Platform) => {
    setPlatformToggles((prev) => ({ ...prev, [platform]: !prev[platform] }))
  }

  const addHashtag = () => {
    const tag = newTag.trim()
    if (!tag) return
    const formatted = tag.startsWith('#') ? tag : `#${tag}`
    if (!hashtags.includes(formatted)) {
      setHashtags([...hashtags, formatted])
    }
    setNewTag('')
  }

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag))
  }

  const validate = (): string | null => {
    if (!name.trim()) return 'Brand name is required'
    const enabledCount = Object.values(platformToggles).filter(Boolean).length
    if (enabledCount === 0) return 'At least one platform must be enabled'
    if (website && !website.match(/^https?:\/\/.+/)) return 'Website must start with http:// or https://'
    if (!colors.primary.match(/^#[0-9a-fA-F]{6}$/)) return 'Primary color must be a valid hex code'
    return null
  }

  const handleSave = async () => {
    setError('')
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    const enabledPlatforms = (Object.keys(platformToggles) as Platform[]).filter(
      (p) => platformToggles[p],
    )

    const success = await updateProfile(supabase, activeProfile.id, {
      name: name.trim(),
      description: description.trim(),
      voice: voice.trim(),
      website: website.trim(),
      colors,
      hashtags,
      enabled_platforms: enabledPlatforms,
    })

    if (success) {
      // Update local context
      const updated: BrandProfile = {
        ...activeProfile,
        name: name.trim(),
        description: description.trim(),
        voice: voice.trim(),
        website: website.trim(),
        colors,
        hashtags,
        enabledPlatforms,
      }
      setActiveProfile(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      // Even if Supabase fails, update locally (demo mode)
      const updated: BrandProfile = {
        ...activeProfile,
        name: name.trim(),
        description: description.trim(),
        voice: voice.trim(),
        website: website.trim(),
        colors,
        hashtags,
        enabledPlatforms: (Object.keys(platformToggles) as Platform[]).filter(
          (p) => platformToggles[p],
        ),
      }
      setActiveProfile(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }

    setSaving(false)
  }

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return
    setError('')

    const slug = newBrandName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const id = await createProfile(supabase, {
      slug,
      name: newBrandName.trim(),
      description: 'New brand — edit me!',
      voice: 'professional, engaging',
      colors: { primary: '#4a7cf7', secondary: '#0a0a0f', accent: '#e7f900' },
      hashtags: [],
      website: '',
      enabled_platforms: ['twitter'],
    })

    if (id) {
      const newProfile: BrandProfile = {
        id,
        name: newBrandName.trim(),
        slug,
        description: 'New brand — edit me!',
        voice: 'professional, engaging',
        colors: { primary: '#4a7cf7', secondary: '#0a0a0f', accent: '#e7f900' },
        hashtags: [],
        website: '',
        enabledPlatforms: ['twitter'],
      }
      setActiveProfile(newProfile)
      setShowAddBrand(false)
      setNewBrandName('')
    } else {
      setError('Failed to create brand (Supabase may not be configured)')
    }
  }

  return (
    <div className="flex flex-col items-center min-h-full p-4 md:p-8 overflow-y-auto">
      <div className="w-full max-w-lg pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Settings</h2>
            <p className="text-brand-muted text-sm mt-0.5">Edit {activeProfile.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-lg bg-brand-card border border-brand-border hover:border-brand-accent transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Account section */}
        <div className="bg-brand-card border border-brand-border rounded-xl p-4 mb-6">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3">
            Account
          </p>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-brand-muted">Email</span>
              <span className="font-medium truncate ml-4">{user?.email || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-brand-muted">User ID</span>
              <span className="text-xs text-brand-muted font-mono truncate ml-4">
                {user?.id ? `${user.id.slice(0, 8)}…` : '—'}
              </span>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full mt-4 py-3 rounded-xl text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all min-h-[48px]"
          >
            Sign Out
          </button>
        </div>

        {/* Brand info — editable */}
        <div className="bg-brand-card border border-brand-border rounded-xl p-4 mb-6">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3">
            Brand Profile
          </p>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs text-brand-muted mb-1 block">Brand Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-brand-dark border border-brand-border text-sm focus:border-brand-accent focus:outline-none transition-colors"
                placeholder="Brand name"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-brand-muted mb-1 block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg bg-brand-dark border border-brand-border text-sm focus:border-brand-accent focus:outline-none transition-colors resize-none"
                placeholder="What does your brand do?"
              />
            </div>

            {/* Voice */}
            <div>
              <label className="text-xs text-brand-muted mb-1 block">Brand Voice</label>
              <input
                type="text"
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-brand-dark border border-brand-border text-sm focus:border-brand-accent focus:outline-none transition-colors"
                placeholder="e.g. bold, futuristic, community-driven"
              />
            </div>

            {/* Website */}
            <div>
              <label className="text-xs text-brand-muted mb-1 block">Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-brand-dark border border-brand-border text-sm focus:border-brand-accent focus:outline-none transition-colors"
                placeholder="https://yourbrand.com"
              />
            </div>

            {/* Colors */}
            <div>
              <label className="text-xs text-brand-muted mb-2 block">Brand Colors</label>
              <div className="flex gap-3">
                {(['primary', 'secondary', 'accent'] as const).map((key) => (
                  <div key={key} className="flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colors[key]}
                        onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-brand-border cursor-pointer bg-transparent"
                      />
                      <div className="flex-1">
                        <p className="text-[10px] text-brand-muted capitalize">{key}</p>
                        <input
                          type="text"
                          value={colors[key]}
                          onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                          className="w-full px-2 py-1 rounded bg-brand-dark border border-brand-border text-[11px] font-mono focus:border-brand-accent focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hashtags */}
            <div>
              <label className="text-xs text-brand-muted mb-2 block">Hashtags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-brand-accent/10 text-brand-accent"
                  >
                    {tag}
                    <button
                      onClick={() => removeHashtag(tag)}
                      className="hover:text-red-400 transition-colors"
                      aria-label={`Remove ${tag}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {hashtags.length === 0 && (
                  <p className="text-xs text-brand-muted italic">No hashtags yet</p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                  className="flex-1 px-3 py-2 rounded-lg bg-brand-dark border border-brand-border text-sm focus:border-brand-accent focus:outline-none transition-colors"
                  placeholder="Add hashtag (without #)"
                />
                <button
                  onClick={addHashtag}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-brand-border hover:border-brand-accent transition-all min-h-[42px]"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Platform toggles */}
        <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2 sm:mb-3">
            Enabled Platforms
          </p>
          {(Object.keys(PLATFORM_META) as Platform[]).map((platform) => {
            const meta = PLATFORM_META[platform]
            const isEnabled = platformToggles[platform]
            return (
              <button
                key={platform}
                onClick={() => togglePlatform(platform)}
                className={`
                  w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all min-h-[56px]
                  ${isEnabled
                    ? 'border-brand-accent bg-brand-accent/5'
                    : 'border-brand-border bg-brand-card'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg sm:text-xl w-8 text-center shrink-0">{meta.icon}</span>
                  <div className="text-left">
                    <p className="font-medium text-sm">{meta.label}</p>
                    <p className="text-[11px] text-brand-muted">
                      {isEnabled ? 'Active' : 'Disabled'}
                    </p>
                  </div>
                </div>
                <div
                  className={`
                    w-12 h-7 rounded-full transition-colors relative shrink-0 ml-3
                    ${isEnabled ? 'bg-brand-accent' : 'bg-brand-border'}
                  `}
                >
                  <div
                    className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-all duration-200"
                    style={{ left: isEnabled ? '26px' : '3px' }}
                  />
                </div>
              </button>
            )
          })}
        </div>

        {/* Add new brand */}
        {showAddBrand ? (
          <div className="bg-brand-card border border-brand-border rounded-xl p-4 mb-6">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3">
              Create New Brand
            </p>
            <input
              type="text"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddBrand()}
              className="w-full px-3 py-2.5 rounded-lg bg-brand-dark border border-brand-border text-sm focus:border-brand-accent focus:outline-none transition-colors mb-3"
              placeholder="New brand name"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddBrand}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-brand-accent text-brand-accent hover:bg-brand-accent/10 transition-all min-h-[42px]"
              >
                Create Brand
              </button>
              <button
                onClick={() => { setShowAddBrand(false); setNewBrandName('') }}
                className="px-4 py-2.5 rounded-lg text-sm font-medium border border-brand-border hover:border-red-500/50 transition-all min-h-[42px]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddBrand(true)}
            className="w-full py-3 rounded-xl text-sm font-medium border border-dashed border-brand-border hover:border-brand-accent transition-all mb-6 min-h-[48px]"
          >
            + Add Brand
          </button>
        )}

        {/* Error message */}
        {error && (
          <p className="text-red-400 text-xs text-center mb-3">{error}</p>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ backgroundColor: colors.primary, color: '#fff' }}
        >
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
