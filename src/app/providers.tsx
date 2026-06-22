'use client'

import { useState, createContext, useContext, useCallback, useEffect, type ReactNode } from 'react'
import { type SupabaseClient, type User, type Session } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import { fetchCurrentPost, savePost } from '@/lib/content'
import { useImageGen } from '@/lib/use-image-gen'

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
  refreshContent: (topic?: string) => Promise<void>
  generating: boolean
  generatingStatus: string
  topics: string[]
  loadTopics: () => Promise<void>
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
  const [generating, setGenerating] = useState(false)
  const [generatingStatus, setGeneratingStatus] = useState('')
  const [topics, setTopics] = useState<string[]>([])
  const { generate } = useImageGen()

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

  // Auto-refresh: check every 60s if current post has expired
  useEffect(() => {
    if (!currentPost) return
    const interval = setInterval(() => {
      if (new Date(currentPost.expiresAt) < new Date()) {
        setCurrentPost(null) // Triggers "Generate Content" state
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [currentPost])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setCurrentPost(null)
  }, [supabase])

  const refreshContent = useCallback(async (topic?: string) => {
    // First try to fetch an existing non-expired post (only if no specific topic requested)
    if (!topic && supabase && user) {
      const existing = await fetchCurrentPost(supabase, activeProfile.id, activePlatform, user.id)
      if (existing) {
        setCurrentPost(existing)
        return
      }
    }

    // No active post — generate a new image via Codex/gpt-image-2
    setGenerating(true)
    setGeneratingStatus('Creating your image...')

    try {
      // Build a prompt from the brand profile
      const prompt = buildImagePrompt(activeProfile, activePlatform)

      const sizeMap: Record<Platform, string> = {
        twitter: '1536x1024',
        instagram: '1024x1024',
        facebook: '1536x1024',
        linkedin: '1536x1024',
      }

      const imageUrl = await generate(prompt, sizeMap[activePlatform])

      if (!imageUrl) {
        setGenerating(false)
        setGeneratingStatus('')
        return
      }

      setGeneratingStatus('Writing caption...')

      // Generate AI caption via /api/generate-caption
      const caption = await generateCaption(activeProfile, activePlatform, topic)

      // Try to persist image to Supabase Storage (non-blocking — falls back to original URL)
      let storedImageUrl = imageUrl
      try {
        const storeRes = await fetch('/api/store-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl }),
        })
        if (storeRes.ok) {
          const storeData = await storeRes.json()
          if (storeData.storedUrl) storedImageUrl = storeData.storedUrl
        }
      } catch {
        // Non-critical — use the ephemeral URL
      }

      // Save to Supabase if available
      let savedPost: ContentPost | null = null
      if (supabase && user) {
        savedPost = await savePost(supabase, {
          profileId: activeProfile.id,
          userId: user.id,
          platform: activePlatform,
          imageUrl: storedImageUrl,
          caption,
        })
      }

      // Set the post (saved or ephemeral)
      if (savedPost) {
        setCurrentPost(savedPost)
      } else {
        // Ephemeral post (no Supabase) — still show it
        setCurrentPost({
          id: `ephemeral-${Date.now()}`,
          profileId: activeProfile.id,
          platform: activePlatform,
          imageUrl,
          caption,
          generatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
      }

      setGenerating(false)
      setGeneratingStatus('')
    } catch (err) {
      setGenerating(false)
      setGeneratingStatus('')
      console.error('Generation failed:', err)
    }
  }, [supabase, user, activeProfile, activePlatform, generate])

  const loadTopics = useCallback(async () => {
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: activeProfile }),
      })
      if (res.ok) {
        const data = await res.json()
        setTopics(data.topics || [])
      }
    } catch {
      // Silent fail — topics are optional
    }
  }, [activeProfile])

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
      generating,
      generatingStatus,
      topics,
      loadTopics,
    }}>
      {children}
    </AppContext.Provider>
  )
}

// ── Helpers ────────────────────────────────────────────────────────

function buildImagePrompt(profile: BrandProfile, platform: Platform): string {
  const isNeon = profile.colors.primary === '#e7f900' || profile.colors.accent === '#e7f900'
  const theme = isNeon
    ? 'neon yellow and dark futuristic crypto aesthetic, glowing accents'
    : `clean modern aesthetic with ${profile.colors.primary} accents`

  const platformHints: Record<Platform, string> = {
    twitter: 'wide horizontal composition, 16:9 ratio',
    instagram: 'square composition, centered, 1:1 ratio',
    facebook: 'wide horizontal composition, bold headline area',
    linkedin: 'professional wide composition, clean negative space',
  }

  // Keep prompt short for reliability (gpt-image-2 prefers <60 words)
  return `${profile.name} social media post image. ${theme}. ${profile.description}. ${platformHints[platform]}. Bold, eye-catching, high quality, no text overlay.`
}

async function generateCaption(
  profile: BrandProfile,
  platform: Platform,
  topic?: string,
): Promise<string> {
  try {
    const res = await fetch('/api/generate-caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: {
          name: profile.name,
          description: profile.description,
          voice: profile.voice,
          hashtags: profile.hashtags,
          website: profile.website,
        },
        platform,
        topic,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.caption) return data.caption
    }

    // Fallback to local template if API fails
    console.warn('Caption API failed, using fallback')
  } catch (err) {
    console.warn('Caption API error, using fallback:', err)
  }

  return fallbackCaption(profile, platform)
}

function fallbackCaption(profile: BrandProfile, platform: Platform): string {
  const tags = profile.hashtags.slice(0, platform === 'instagram' ? 8 : 3).join(' ')
  return `Stay ahead with ${profile.name}. ${profile.description} ${tags}`
}
