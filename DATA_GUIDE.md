# Social Content Studio — Developer Guide

> For Data picking up issues #2-7. This covers the exact patterns, endpoints, and commands you need.

## Quick Reference

**Live URL:** https://social-content-app-pi.vercel.app
**Repo:** `CryptoSI-DAO/social-content-app`
**Framework:** Next.js 16 (App Router) + TypeScript + Tailwind
**Backend:** Self-hosted Supabase (proxy through Vercel serverless)

## Architecture

```
Browser (Vercel HTTPS)
  → Next.js middleware (auth check)
  → App pages (SSR + client)
  → Supabase JS client
  → /supabase-proxy/* (Next.js catch-all route — bypasses CORS/HTTPS issues)
  → Self-hosted Supabase (HTTP :8000)
```

### Why the proxy?

Our Supabase is self-hosted on HTTP port 8000. Browsers block mixed content (HTTPS page → HTTP API). The `/supabase-proxy/[...path]` route runs server-side on Vercel, forwards requests to Supabase, and returns responses over HTTPS.

### Supabase connection pattern

```typescript
// Browser-side (client components)
import { supabase } from '@/lib/supabase'
// supabase is null if env vars missing (demo mode)

// Server-side (RSC, middleware, route handlers)
import { createServerSupabaseClient } from '@/lib/supabase-server'
const supabase = await createServerSupabaseClient()
```

## Environment Variables (on Vercel)

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://social-content-app-pi.vercel.app/supabase-proxy` | Points to proxy, NOT directly to Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (JWT anon key) | Public key, safe for client |
| `SUPABASE_BACKEND_URL` | `http://173.249.36.76:8000` | Server-side only, direct Supabase URL |

To update env vars:
```bash
cd /home/lisa/projects/social-content-app
# Remove old
/root/.hermes/node/bin/vercel env rm VAR_NAME production --yes
# Add new
echo 'value' | /root/.hermes/node/bin/vercel env add VAR_NAME production
# Redeploy
/root/.hermes/node/bin/vercel deploy --prod --yes
```

## Build & Deploy

```bash
# Run as lisa user (npm permissions)
su - lisa -c 'cd /home/lisa/projects/social-content-app && \
  export PATH=/home/lisa/.nvm/versions/node/v22.22.3/bin:$PATH && \
  npm run build'

# Deploy to Vercel (run as root)
cd /home/lisa/projects/social-content-app
/root/.hermes/node/bin/vercel deploy --prod --yes
```

## Database Schema

Tables: `profiles` (brand configs), `posts` (generated content, auto-expires 24h).

### posts table
```sql
id, profile_id (FK profiles), user_id (FK auth.users),
platform ('twitter'|'instagram'|'facebook'|'linkedin'),
image_url, caption, generated_at, expires_at (NOW()+24h), created_at
```

**RLS:** Users can only see/manage their own posts (`auth.uid() = user_id`).
**Profiles:** Readable by all authenticated users.

## Issue Guide

### #2 — AI Caption Generation

**What:** Generate platform-appropriate captions using brand voice.

**Where:** Add a server-side API route at `src/app/api/generate-caption/route.ts`.

**Approach:**
```typescript
// POST /api/generate-caption
// Body: { profileId, platform, voice, hashtags }
// Returns: { caption: string }
```

**AI options (pick one):**
1. **ZAI GLM-5.1** — Server already has an API key at `/tmp/zai_key.txt`
   ```python
   # Via litellm or direct HTTP
   POST https://api.z.ai/api/coding/paas/v4/chat/completions
   ```
2. **OpenAI** — Needs `OPENAI_API_KEY` env var on Vercel (user has ChatGPT Plus)

**Pattern:** The route receives brand voice + platform constraints, calls the LLM, returns a formatted caption with hashtags. Use `savePost()` from `src/lib/content.ts` to persist.

**Char limits by platform:** twitter 280, instagram 2200, facebook 63000, linkedin 3000.

### #3 — AI Image Generation

**What:** Generate branded images for posts.

**Where:** Add `src/app/api/generate-image/route.ts`.

**Options:**
1. **Codex CLI + gpt-image-2** — User has ChatGPT Plus ($20/mo). See `codex-image-gen` skill.
2. **DALL-E 3 API** — Needs OpenAI key
3. **Placeholder images** — Use `https://placehold.co/1200x630/BRAND_COLOR/fff?text=Profile+Name`

**Image ratios:** twitter 16:9, instagram 1:1 or 4:5, facebook 1.91:1, linkedin 1.91:1.

### #4 — 24-hour Auto-Refresh

**What:** Posts expire after 24h. Show a countdown, auto-fetch/generate new content.

**Where:** Add to `providers.tsx` — a `useEffect` with timer checking `expiresAt`.

```typescript
// Check every minute if current post expired
useEffect(() => {
  if (!currentPost) return
  const interval = setInterval(() => {
    if (new Date(currentPost.expiresAt) < new Date()) {
      setCurrentPost(null)  // Triggers "Generate" state
    }
  }, 60000)
  return () => clearInterval(interval)
}, [currentPost])
```

### #5 — Copy-to-clipboard + Direct Share

**Already partially done!** `ContentCard.tsx` has copy-to-clipboard (lines ~30-42).

**Add:** "Share" button using the Web Share API:
```typescript
if (navigator.share) {
  await navigator.share({ title: profile.name, text: post.caption })
}
```

### #6 — Editable Brand Profiles

**What:** Settings panel to edit brand voice, colors, hashtags, platforms.

**Where:** `src/components/SettingsPanel.tsx` already exists. Wire it up to Supabase:

```typescript
// Update profile
const { error } = await supabase
  .from('profiles')
  .update({ voice, colors, hashtags })
  .eq('id', profileId)
```

**Note:** RLS policy `Profiles updatable by authenticated` allows any authenticated user to edit. Fine for single-user app.

### #7 — Content History / Archive

**What:** Show past posts (expired + current).

**Where:** New page `src/app/history/page.tsx`.

**Function already exists:** `fetchPostHistory()` in `src/lib/content.ts`.

```typescript
const posts = await fetchPostHistory(supabase, profileId, userId, 20)
// Render as scrollable list of ContentCards (simplified)
```

## Codex CLI (for image generation — issue #3)

```bash
# Available on the server. Auth'd to user's ChatGPT Plus account.
codex --image "A futuristic neon yellow crypto trading dashboard, dark theme" \
  --output /tmp/generated-image.png
```

See the `codex-image-gen` skill for full details.

## Vercel CLI

All Vercel commands run as root from `/home/lisa/projects/social-content-app`:
```bash
/root/.hermes/node/bin/vercel deploy --prod --yes    # Deploy
/root/.hermes/node/bin/vercel logs                    # View logs
/root/.hermes/node/bin/vercel env ls                  # List env vars
/root/.hermes/node/bin/vercel inspect <url>           # Inspect deployment
```

## Common Pitfalls

1. **Don't point NEXT_PUBLIC_SUPABASE_URL directly at Supabase** — browsers will block mixed content. Always use the `/supabase-proxy` prefix.
2. **npm commands must run as `lisa` user** — root doesn't have nvm/node in PATH.
3. **The `openai` package is already installed** — listed in package.json deps.
4. **Tailwind config has brand colors** — `bg-brand-dark`, `text-brand-accent`, `border-brand-border`, etc.
5. **ContentCard handles the null state** — if `currentPost` is null, it shows a "Generate Content" button. Use this pattern for new components.
6. **All new API routes must be excluded from middleware** — or they'll require auth. Add to the matcher exclusion in `middleware.ts`.

## File Map

```
src/
├── app/
│   ├── layout.tsx          # Root layout (Providers + Sidebar + BottomNav)
│   ├── page.tsx            # Home (redirects to /login if not authed)
│   ├── Dashboard.tsx       # Main content view
│   ├── providers.tsx       # Global state: auth, profiles, posts, platform
│   ├── globals.css         # Tailwind + brand colors
│   ├── (auth)/login/       # Login page
│   ├── auth/callback/      # OAuth callback
│   └── supabase-proxy/     # Catch-all proxy route
├── components/
│   ├── ContentCard.tsx     # Post display + copy button
│   ├── Sidebar.tsx         # Brand profile selector
│   ├── BottomNav.tsx       # Mobile platform switcher
│   └── SettingsPanel.tsx   # Brand settings (stub)
├── lib/
│   ├── supabase.ts         # Browser client (null-safe)
│   ├── supabase-server.ts  # Server client (null-safe)
│   └── content.ts          # fetchCurrentPost, savePost, fetchPostHistory
├── middleware.ts           # Auth middleware (skips if no env vars)
└── supabase/schema.sql     # DB schema reference
```
