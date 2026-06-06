-- Social Content App — Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Profiles table ──────────────────────────────────────────────
-- Stores brand configurations
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  voice TEXT DEFAULT '',
  colors JSONB DEFAULT '{"primary":"#4a7cf7","secondary":"#0a0a0f","accent":"#e7f900"}'::jsonb,
  hashtags TEXT[] DEFAULT '{}',
  website TEXT DEFAULT '',
  enabled_platforms TEXT[] DEFAULT '{twitter,instagram,facebook,linkedin}',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Posts table ──────────────────────────────────────────────────
-- Stores generated content (auto-expires after 24h)
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter','instagram','facebook','linkedin')),
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Index for fast lookups ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_profile_platform ON posts(profile_id, platform);
CREATE INDEX IF NOT EXISTS idx_posts_expires ON posts(expires_at);

-- ── Auto-cleanup expired posts (optional, runs via pg_cron) ─────
-- Uncomment if you have pg_cron enabled:
-- SELECT cron.schedule('cleanup-expired-posts', '0 * * * *', $$
--   DELETE FROM posts WHERE expires_at < NOW();
-- $$);

-- ── Row Level Security ───────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (single-user app)
CREATE POLICY "Allow all for authenticated" ON profiles
  FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated" ON posts
  FOR ALL USING (true);

-- ── Seed data ────────────────────────────────────────────────────
INSERT INTO profiles (slug, name, description, voice, colors, hashtags, website, enabled_platforms)
VALUES
  (
    'cryptosidao',
    'CryptoSIDAO',
    'CryptoSI DAO — decentralized community and ecosystem',
    'bold, futuristic, crypto-literate, community-driven',
    '{"primary":"#4a7cf7","secondary":"#0a0a0f","accent":"#e7f900"}',
    '{#CryptoSIDAO,#DAO,#Web3,#Crypto}',
    'https://cryptosidao.org',
    '{twitter,instagram,facebook,linkedin}'
  ),
  (
    'caselens',
    'CaseLens',
    'CaseLens — legal case analysis platform',
    'professional, analytical, clear, authoritative',
    '{"primary":"#2563eb","secondary":"#f8fafc","accent":"#0ea5e9"}',
    '{#CaseLens,#LegalTech,#Law,#Legal}',
    'https://caselens.app',
    '{twitter,linkedin}'
  )
ON CONFLICT (slug) DO NOTHING;
