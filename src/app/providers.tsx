'use client'

import { useState, createContext, useContext, useCallback, useEffect, type ReactNode } from 'react'
import { type SupabaseClient, type User, type Session } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import { fetchCurrentPost } from '@/lib/content'

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

// ── Brand Config ───────────────────────────────────────────────────
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
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
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

// ── Supabase client (SSR-compatible, cookie-based) ────────────────
function createSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createBrowserClient(url, key)
}

// ── Provider ───────────────────────────────────────────────────────
export function Providers({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createSupabaseClient())
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeProfile, setActiveProfile] = useState<BrandProfile>(BRAND_PROFILES[0])
  const [activePlatform, setActivePlatform] = useState<Platform>('twitter')
  const [currentPost, setCurrentPost] = useState<ContentPost | null>(null)

  // Listen for auth state changes
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      setLoading(false)
    })

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Fetch current post from Supabase when user/profile/platform changes
  useEffect(() => {
    if (!supabase || !user) return
    fetchCurrentPost(supabase, activeProfile.id, activePlatform, user.id).then(setCurrentPost)
  }, [supabase, user, activeProfile, activePlatform])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setCurrentPost(null)
  }, [supabase])

  const refreshContent = useCallback(async () => {
    if (!supabase || !user) {
      console.log('Demo mode — no Supabase connected')
      return
    }

    // First try to fetch an existing non-expired post
    const existing = await fetchCurrentPost(supabase, activeProfile.id, activePlatform, user.id)
    if (existing) {
      setCurrentPost(existing)
      return
    }

    // No active post — TODO: generate via AI (issues #2, #3)
    // For now, just log
    console.log('No active post found — AI generation not yet implemented')
  }, [supabase, user, activeProfile, activePlatform])

  return (
    <AppContext.Provider value={{
      supabase,
      user,
      session,
      loading,
      signOut,
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
