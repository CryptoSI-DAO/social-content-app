# Social Content Studio

AI-powered social media content generator for your brands. Generates daily images and captions, stored in Supabase with 24-hour refresh cycles.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Set up Supabase
# Run supabase/schema.sql in your Supabase SQL editor (or use /pg/query endpoint)

# 4. Run locally
npm run dev
# Open http://localhost:3000
```

## Supabase Setup (Self-Hosted)

This app connects to a self-hosted Supabase instance.

### Database Schema

Tables are created automatically via the `/pg/query` endpoint:

- **profiles** — Brand configurations (name, voice, colors, hashtags, platforms)
- **posts** — Generated content with 24-hour expiry, scoped to `user_id`

### Row Level Security

- `profiles`: Readable by all authenticated users
- `posts`: Users can only CRUD their own posts (via `user_id` foreign key to `auth.users`)

### Auth

- Email/password authentication with confirmation links
- Middleware protects all routes except `/login` and `/auth/callback`
- Session managed via cookies (`@supabase/ssr`)

## Deploy to Vercel

```bash
# Connect repo to Vercel, then add env vars in Vercel dashboard:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Architecture

- **Frontend**: Next.js 16 + Tailwind CSS (dark theme, mobile-first)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Image Gen**: OpenAI Image-1 (coming soon)
- **Content Gen**: News API + GPT (coming soon)

## Brand Profiles

Edit `src/app/providers.tsx` → `BRAND_PROFILES` to add/edit brands.

## Roadmap

- [x] Scaffolding: layout, sidebar, bottom nav, card view, settings
- [x] Supabase auth: login, signup, middleware, RLS policies
- [x] Database: profiles + posts tables with user scoping
- [ ] Supabase integration (fetch/save posts)
- [ ] OpenAI image generation
- [ ] News API integration for content signals
- [ ] Caption generation with brand voice
- [ ] 24-hour auto-refresh logic
- [ ] Copy-to-clipboard + direct share
- [ ] Content history / archive
