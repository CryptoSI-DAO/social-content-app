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
  refreshContent: () => Promise<void>
  generating: boolean
  generatingStatus: string
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

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setCurrentPost(null)
  }, [supabase])

  const refreshContent = useCallback(async () => {
    // First try to fetch an existing non-expired post
    if (supabase && user) {
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

      // Generate a simple caption from brand voice
      const caption = buildCaption(activeProfile, activePlatform)

      // Save to Supabase if available
      let savedPost: ContentPost | null = null
      if (supabase && user) {
        savedPost = await savePost(supabase, {
          profileId: activeProfile.id,
          userId: user.id,
          platform: activePlatform,
          imageUrl,
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
    }}>
      {children}
    </AppContext.Provider>
  )
}

// ── Helpers ────────────────────────────────────────────────────────

function buildImagePrompt(profile: BrandProfile, platform: Platform): string {
  const theme = profile.colors.primary === '#e7f900' || profile.colors.accent === '#e7f900'
    ? 'neon yellow and dark futuristic crypto aesthetic'
    : 'professional clean modern aesthetic'

  const platformHint = platform === 'instagram'
    ? 'square composition'
    : 'wide banner composition'

  // Keep prompt short for reliability (gpt-image-2 prefers <60 words)
  return `${profile.name} social media ${platform} post image. ${theme}. ${profile.description}. ${platformHint}. Bold, eye-catching, high quality.`
}

function buildCaption(profile: BrandProfile, platform: Platform): string {
  const tags = profile.hashtags.slice(0, platform === 'instagram' ? 8 : 3).join(' ')
  const lines: string[] = []

  if (profile.id === 'cryptosidao') {
    const templates = [
      `Building the future of decentralized communities. The revolution won't be centralized. 🚀\n\n${tags}`,
      `Web3 is here. Are you ready? Join the movement. 💎\n\n${tags}`,
      `Decentralization isn't just a buzzword — it's the future. 🔮\n\n${tags}`,
    ]
    lines.push(templates[Math.floor(Math.random() * templates.length)])
  } else {
    const templates = [
      `Innovation meets excellence. This is ${profile.name}. ✨\n\n${tags}`,
      `Stay ahead of the curve with ${profile.name}. 💡\n\n${tags}`,
      `The future is now. ${profile.description}. 🔥\n\n${tags}`,
    ]
    lines.push(templates[Math.floor(Math.random() * templates.length)])
  }

  return lines[0]
}
