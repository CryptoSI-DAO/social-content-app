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
# Run supabase/schema.sql in your Supabase SQL editor

# 4. Run locally
npm run dev
# Open http://localhost:3000
```

## Deploy to Vercel

```bash
# Connect repo to Vercel, then add env vars in Vercel dashboard:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - OPENAI_API_KEY (when ready)
```

## Architecture

- **Frontend**: Next.js 14 + Tailwind CSS (dark theme, mobile-first)
- **Backend**: Supabase (PostgreSQL + Storage)
- **Image Gen**: OpenAI Image-1 (coming soon)
- **Content Gen**: News API + GPT (coming soon)

## Brand Profiles

Edit `src/app/providers.tsx` → `BRAND_PROFILES` to add/edit brands.

## Roadmap

- [x] Scaffolding: layout, sidebar, bottom nav, card view, settings
- [ ] Supabase integration (fetch/save posts)
- [ ] OpenAI image generation
- [ ] News API integration for content signals
- [ ] Caption generation with brand voice
- [ ] 24-hour auto-refresh logic
- [ ] Copy-to-clipboard + direct share
- [ ] Content history / archive
