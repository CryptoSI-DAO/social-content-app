import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface RequestBody {
  profile?: {
    name?: string
    description?: string
    voice?: string
  }
  platform?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { profile } = body

    if (!profile?.name) {
      return NextResponse.json(
        { error: 'Missing required field: profile.name' },
        { status: 400 },
      )
    }

    const apiKey = process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY
    const baseURL = process.env.ZAI_API_KEY
      ? 'https://api.z.ai/api/coding/paas/v4'
      : undefined

    if (!apiKey) {
      // Return generic fallback topics
      return NextResponse.json({
        topics: getDefaultTopics(profile.name),
      })
    }

    const client = new OpenAI({ apiKey, baseURL })
    const model = process.env.ZAI_API_KEY ? 'glm-4.6' : 'gpt-4o-mini'

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a social media strategist for "${profile.name}" (${profile.description || ''}). Generate 5 trending, compelling topic ideas for social media posts. Each topic should be a short phrase (3-8 words). Output as a JSON array of strings. No preamble, no explanation — just the JSON array.`,
        },
        {
          role: 'user',
          content: `Give me 5 fresh topic ideas for ${profile.name}.`,
        },
      ],
      max_tokens: 300,
      temperature: 0.9,
    })

    const raw = completion.choices[0]?.message?.content?.trim() || '[]'

    let topics: string[]
    try {
      topics = JSON.parse(raw)
    } catch {
      // Fallback: split by newlines and clean
      topics = raw
        .split('\n')
        .map((t) => t.replace(/^\d+[\.\)]\s*/, '').replace(/[""]/g, '').trim())
        .filter(Boolean)
        .slice(0, 5)
    }

    if (!topics.length) {
      topics = getDefaultTopics(profile.name)
    }

    return NextResponse.json({ topics })
  } catch (err) {
    console.error('Topics generation error:', err)
    return NextResponse.json(
      { topics: getDefaultTopics('brand') },
      { status: 200 },
    )
  }
}

function getDefaultTopics(brandName: string): string[] {
  return [
    `${brandName} community spotlight`,
    'Behind the scenes',
    'Industry trends this week',
    'Quick tips and insights',
    'What makes us different',
  ]
}
