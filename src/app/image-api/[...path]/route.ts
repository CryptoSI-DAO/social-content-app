import { NextRequest, NextResponse } from 'next/server'

const IMAGE_API_BACKEND = process.env.IMAGE_API_BACKEND || 'http://173.249.36.76:8082'

export async function GET(request: NextRequest) {
  return handleProxy(request)
}

export async function POST(request: NextRequest) {
  return handleProxy(request)
}

async function handleProxy(request: NextRequest) {
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/image-api/, '') || '/'
  const queryString = url.search || ''

  // Map /image-api/image-gen/X → /image-gen/X, /image-api/images/X → /images/X
  const targetUrl = `${IMAGE_API_BACKEND}${path}${queryString}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (request.headers.get('authorization')) {
    headers['authorization'] = request.headers.get('authorization')!
  }

  try {
    const method = request.method
    const body = ['GET', 'HEAD'].includes(method) ? undefined : await request.text()

    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    })

    const data = await response.arrayBuffer()

    const contentType = response.headers.get('content-type') || 'application/json'
    return new NextResponse(data, {
      status: response.status,
      headers: { 'Content-Type': contentType },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Image API proxy error', detail: String(err) },
      { status: 502 }
    )
  }
}
