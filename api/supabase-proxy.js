/**
 * Vercel serverless proxy — forwards Supabase API requests from the browser
 * to our self-hosted Supabase instance.
 *
 * This avoids CORS and mixed-content issues (browser → HTTPS Vercel → HTTP Supabase).
 *
 * Usage: NEXT_PUBLIC_SUPABASE_URL should point to this proxy path.
 * e.g. NEXT_PUBLIC_SUPABASE_URL=https://social-content-app.vercel.app/supabase-proxy
 */

const SUPABASE_BACKEND = process.env.SUPABASE_BACKEND_URL || 'http://173.249.36.76:8000'

export default async function handler(req: {
  method: string
  url: string
  headers: Record<string, string>
  body: unknown
}) {
  // Extract the path after /supabase-proxy
  const url = new URL(req.url, 'http://localhost')
  const path = url.pathname.replace(/^\/supabase-proxy/, '') || '/'
  const queryString = url.search || ''
  const targetUrl = `${SUPABASE_BACKEND}${path}${queryString}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Forward Supabase auth headers
  if (req.headers['apikey']) headers['apikey'] = req.headers['apikey']
  if (req.headers['authorization']) headers['authorization'] = req.headers['authorization']

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    })

    const data = await response.text()

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: data,
    }
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Supabase proxy error', detail: String(err) }),
    }
  }
}
