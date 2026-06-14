'use client'

import { useState, useCallback, useRef } from 'react'

const IMAGE_API = '/image-api/image-gen'

interface ImageJob {
  jobId: string
  status: 'generating' | 'complete' | 'failed'
  imageUrl?: string
  error?: string
}

/**
 * Hook for generating images via Codex CLI / gpt-image-2 on the server.
 * Uses async polling — generation takes 60-90s.
 */
export function useImageGen() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const generate = useCallback(async (prompt: string, size?: string): Promise<string | null> => {
    setLoading(true)
    setError(null)
    setImageUrl(null)

    try {
      // Step 1: Start generation
      const startRes = await fetch(IMAGE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size: size || '1024x1024' }),
      })

      if (!startRes.ok) {
        const err = await startRes.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to start image generation')
      }

      const job: ImageJob = await startRes.json()
      const jobId = job.jobId

      if (!jobId) throw new Error('No job ID returned')

      // Step 2: Poll for completion (every 5s, max 3 min)
      const maxAttempts = 36
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 5000))

        const pollRes = await fetch(`${IMAGE_API}/${jobId}`)
        if (!pollRes.ok) continue

        const pollJob: ImageJob = await pollRes.json()

        if (pollJob.status === 'complete') {
          // Image URL comes back as server path like /images/gen_XXX.png
          // Proxy it through our Vercel route
          const serverPath = pollJob.imageUrl || ''
          const proxiedUrl = serverPath.replace(/^\//, '/image-api/')
          setImageUrl(proxiedUrl)
          setLoading(false)
          return proxiedUrl
        }

        if (pollJob.status === 'failed') {
          throw new Error(pollJob.error || 'Image generation failed')
        }
      }

      throw new Error('Image generation timed out after 3 minutes')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      setLoading(false)
      return null
    }
  }, [])

  const reset = useCallback(() => {
    if (pollRef.current) clearTimeout(pollRef.current)
    setLoading(false)
    setError(null)
    setImageUrl(null)
  }, [])

  return { generate, loading, error, imageUrl, reset }
}
