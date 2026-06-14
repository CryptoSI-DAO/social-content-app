import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_BACKEND = process.env.SUPABASE_BACKEND_URL || 'http://173.249.36.76:8000'

export async function GET(request: NextRequest) {
  return handleProxy(request)
}

export async function POST(request: NextRequest) {
  return handleProxy(request)
}

export async function PUT(request: NextRequest) {
  return handleProxy(request)
}

export async function PATCH(request: NextRequest) {
  return handleProxy(request)
}

export async function DELETE(request: NextRequest) {
  return handleProxy(request)
}

async function handleProxy(request: NextRequest) {
  // Extract the path after /supabase-proxy
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/supabase-proxy/, '') || '/'
  const queryString = url.search || ''
  const targetUrl = `${SUPABASE_BACKEND}${path}${queryString}`

  // Forward headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (request.headers.get('apikey')) headers['apikey'] = request.headers.get('apikey')!
  if (request.headers.get('authorization')) headers['authorization'] = request.headers.get('authorization')!

  try {
    const method = request.method
    const body = ['GET', 'HEAD'].includes(method) ? undefined : await request.text()

    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    })

    const data = await response.text()

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Supabase proxy error', detail: String(err) },
      { status: 502 }
    )
  }
}
