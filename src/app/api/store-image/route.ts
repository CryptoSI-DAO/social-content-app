import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * POST /api/store-image
 * Body: { imageUrl: string, postId?: string }
 * 
 * Fetches an image from the ephemeral Lisa server URL and uploads it
 * to Supabase Storage so it persists for history/archive.
 * Returns: { storedUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Resolve the image URL — it may be a proxy path like /image-api/images/xxx.png
    let fetchUrl = imageUrl
    if (imageUrl.startsWith('/image-api/')) {
      const backend = process.env.IMAGE_API_BACKEND || 'http://173.249.36.76:8082'
      fetchUrl = imageUrl.replace(/^\/image-api/, backend)
    }

    // Fetch the image
    const imgRes = await fetch(fetchUrl)
    if (!imgRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
    }

    const imgBuffer = await imgRes.arrayBuffer()
    const contentType = imgRes.headers.get('content-type') || 'image/png'
    const ext = contentType.includes('jpeg') ? 'jpg' : 'png'
    const fileName = `posts/${user.id}/${Date.now()}.${ext}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('posts')
      .upload(fileName, imgBuffer, {
        contentType,
        upsert: false,
      })

    if (error) {
      // If bucket doesn't exist, return the original URL as fallback
      console.warn('Storage upload failed, using original URL:', error.message)
      return NextResponse.json({ storedUrl: imageUrl })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('posts')
      .getPublicUrl(fileName)

    return NextResponse.json({ storedUrl: urlData.publicUrl })
  } catch (err) {
    console.error('Store image error:', err)
    return NextResponse.json(
      { error: 'Failed to store image', detail: String(err) },
      { status: 500 },
    )
  }
}
