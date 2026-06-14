'use client'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ContentPost, Platform } from '@/app/providers'

/**
 * Fetch the current (non-expired) post for a profile + platform.
 * Returns null if no active post exists.
 */
export async function fetchCurrentPost(
  supabase: SupabaseClient | null,
  profileId: string,
  platform: Platform,
  userId: string,
): Promise<ContentPost | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('profile_id', profileId)
    .eq('platform', platform)
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  return {
    id: data.id,
    profileId: data.profile_id,
    platform: data.platform,
    imageUrl: data.image_url,
    caption: data.caption,
    generatedAt: data.generated_at,
    expiresAt: data.expires_at,
  }
}

/**
 * Save a generated post to Supabase.
 */
export async function savePost(
  supabase: SupabaseClient | null,
  post: {
    profileId: string
    userId: string
    platform: Platform
    imageUrl: string
    caption: string
  },
): Promise<ContentPost | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('posts')
    .insert({
      profile_id: post.profileId,
      user_id: post.userId,
      platform: post.platform,
      image_url: post.imageUrl,
      caption: post.caption,
    })
    .select()
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    profileId: data.profile_id,
    platform: data.platform,
    imageUrl: data.image_url,
    caption: data.caption,
    generatedAt: data.generated_at,
    expiresAt: data.expires_at,
  }
}

/**
 * Fetch post history for a profile (including expired).
 */
export async function fetchPostHistory(
  supabase: SupabaseClient | null,
  profileId: string,
  userId: string,
  limit = 20,
): Promise<ContentPost[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('profile_id', profileId)
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return data.map((row: Record<string, string>) => ({
    id: row.id,
    profileId: row.profile_id,
    platform: row.platform as Platform,
    imageUrl: row.image_url,
    caption: row.caption,
    generatedAt: row.generated_at,
    expiresAt: row.expires_at,
  }))
}

/**
 * Fetch brand profiles from Supabase (falls back to hardcoded BRAND_PROFILES).
 */
export async function fetchProfiles(
  supabase: SupabaseClient | null,
): Promise<Array<{
  id: string
  slug: string
  name: string
  voice: string
  colors: { primary: string; secondary: string; accent: string }
  hashtags: string[]
  website: string
  enabledPlatforms: Platform[]
}> | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')

  if (error || !data || data.length === 0) return null

  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    voice: (row.voice as string) || '',
    colors: (row.colors as { primary: string; secondary: string; accent: string }) || { primary: '#4a7cf7', secondary: '#0a0a0f', accent: '#e7f900' },
    hashtags: (row.hashtags as string[]) || [],
    website: (row.website as string) || '',
    enabledPlatforms: (row.enabled_platforms as Platform[]) || ['twitter', 'instagram', 'facebook', 'linkedin'],
  }))
}
