'use client'

import { useState, createContext, useContext, useCallback, useEffect } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ── Types ──────────────────────────────────────────────────────────
export type Platform = 'twitter' | 'instagram' | 'facebook' | 'linkedin'

export interface BrandProfile {
  id: string
  name: string
  slug: string
  description: string
  voice: string
  colors: { primary: string; secondary: string; accent: string }
  hashtags: string[]
  website: string
  enabledPlatforms: Platform[]
  avatarUrl?: string
}

export interface ContentPost {
  id: string
  profileId: string
  platform: Platform
  imageUrl: string
  caption: string
  generatedAt: string
  expiresAt: string
}

// ── Brand Config (fill in later) ───────────────────────────────────
export const BRAND_PROFILES: BrandProfile[] = [
  {
    id: 'cryptosidao',
    name: 'CryptoSIDAO',
    slug: 'cryptosidao',
    description: 'CryptoSI DAO — decentralized community and ecosystem',
    voice: 'bold, futuristic, crypto-literate, community-driven',
    colors: { primary: '#4a7cf7', secondary: '#0a0a0f', accent: '#e7f900' },
    hashtags: ['#CryptoSIDAO', '#DAO', '#Web3', '#Crypto'],
    website: 'https://cryptosidao.org',
    enabledPlatforms: ['twitter', 'instagram', 'facebook', 'linkedin'],
  },
  {
    id: 'caselens',
    name: 'CaseLens',
    slug: 'caselens',
    description: 'CaseLens — legal case analysis platform',
    voice: 'professional, analytical, clear, authoritative',
    colors: { primary: '#2563eb', secondary: '#f8fafc', accent: '#0ea5e9' },
    hashtags: ['#CaseLens', '#LegalTech', '#Law', '#Legal'],
    website: 'https://caselens.app',
    enabledPlatforms: ['twitter', 'linkedin'],
  },
]

// ── Context ────────────────────────────────────────────────────────
interface AppContextType {
  supabase: SupabaseClient | null
  activeProfile: BrandProfile
  setActiveProfile: (p: BrandProfile) => void
  activePlatform: Platform
  setActivePlatform: (p: Platform) => void
  currentPost: ContentPost | null
  setCurrentPost: (post: ContentPost | null) => void
  refreshContent: () => Promise<void>
}

const AppContext = createContext<AppContextType | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within Providers')
  return ctx
}

// ── Supabase client ────────────────────────────────────────────────
function createSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// ── Provider ───────────────────────────────────────────────────────
export function Providers({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createSupabaseClient())
  const [activeProfile, setActiveProfile] = useState<BrandProfile>(BRAND_PROFILES[0])
  const [activePlatform, setActivePlatform] = useState<Platform>('twitter')
  const [currentPost, setCurrentPost] = useState<ContentPost | null>(null)

  const refreshContent = useCallback(async () => {
    // TODO: fetch or generate new content for today
    // For now, this is a placeholder
    console.log('Refreshing content for', activeProfile.name, activePlatform)
  }, [activeProfile, activePlatform])

  useEffect(() => {
    refreshContent()
  }, [refreshContent])

  return (
    <AppContext.Provider value={{
      supabase,
      activeProfile,
      setActiveProfile,
      activePlatform,
      setActivePlatform,
      currentPost,
      setCurrentPost,
      refreshContent,
    }}>
      {children}
    </AppContext.Provider>
  )
}
