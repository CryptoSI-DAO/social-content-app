import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Platform character limits
const CHAR_LIMITS: Record<string, number> = {
  twitter: 280,
  instagram: 2200,
  facebook: 63000,
  linkedin: 3000,
}

// Platform tone adjustments
const PLATFORM_TONE: Record<string, string> = {
  twitter: 'punchy, concise, high-impact. Use 1-2 emojis max. 1-3 hashtags.',
  instagram: 'engaging, visual-first, storytelling. Use 3-8 hashtags at the end.',
  facebook: 'conversational, community-focused, warm. 0-2 hashtags.',
  linkedin: 'professional, insightful, thought-leadership tone. 3-5 hashtags.',
}

interface RequestBody {
  profile?: {
    name?: string
    description?: string
    voice?: string
    hashtags?: string[]
    website?: string
  }
  platform?: string
  topic?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { profile, platform, topic } = body

    if (!profile?.name || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields: profile.name, platform' },
        { status: 400 },
      )
    }

    const charLimit = CHAR_LIMITS[platform] || 2200
    const tone = PLATFORM_TONE[platform] || ''
    const tags = profile.hashtags?.length
      ? profile.hashtags.join(', ')
      : ''

    // Build the system prompt for brand voice
    const systemPrompt = `You are a professional social media copywriter. Generate a single social media caption that perfectly matches the brand's voice and platform conventions.

BRAND: ${profile.name}
DESCRIPTION: ${profile.description || 'N/A'}
BRAND VOICE: ${profile.voice || 'professional, engaging'}
AVAILABLE HASHTAGS: ${tags}

PLATFORM: ${platform}
PLATFORM TONE: ${tone}
CHARACTER LIMIT: ${charLimit} characters (STRICT — never exceed)

${topic ? `TOPIC TO WRITE ABOUT: ${topic}` : 'Choose a compelling topic relevant to this brand.'}

RULES:
1. Output ONLY the caption text — no preamble, no quotes, no "Here's your caption:".
2. Stay well within the ${charLimit} character limit.
3. Include relevant hashtags from the brand's list (or create fitting ones).
4. Match the brand voice exactly.
5. Make it scroll-stopping and authentic — not generic AI slop.
6. Use line breaks for readability where appropriate.`

    // Use Z.AI GLM (OpenAI-compatible) or fallback to OpenAI
    const apiKey = process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY
    const baseURL = process.env.ZAI_API_KEY
      ? 'https://api.z.ai/api/coding/paas/v4'
      : undefined // Use OpenAI default

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No AI API key configured. Set ZAI_API_KEY or OPENAI_API_KEY.' },
        { status: 500 },
      )
    }

    const client = new OpenAI({ apiKey, baseURL })
    const model = process.env.ZAI_API_KEY ? 'glm-4.6' : 'gpt-4o-mini'

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: topic ? `Write about: ${topic}` : 'Generate a compelling caption.' },
      ],
      max_tokens: Math.min(1000, Math.ceil(charLimit / 2)),
      temperature: 0.8,
    })

    const caption = completion.choices[0]?.message?.content?.trim() || ''

    if (!caption) {
      return NextResponse.json(
        { error: 'AI returned empty caption' },
        { status: 500 },
      )
    }

    // Truncate to char limit as safety net
    const truncated = caption.length > charLimit
      ? caption.slice(0, charLimit - 1).trim() + '…'
      : caption

    return NextResponse.json({ caption: truncated })
  } catch (err) {
    console.error('Caption generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate caption', detail: String(err) },
      { status: 500 },
    )
  }
}
