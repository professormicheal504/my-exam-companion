-- Migration: add slug + category slug to publisher_posts
-- Run in Supabase Dashboard → SQL Editor

-- ── slug ─────────────────────────────────────────────────────────────────────
-- Public URL slug: e.g. "2026-09-21-how-to-pass-jamb"
-- Set on publish by the post-submission Edge Function.
ALTER TABLE public.publisher_posts
  ADD COLUMN IF NOT EXISTS slug text DEFAULT NULL;

-- Enforce uniqueness — two articles can't share the same URL
CREATE UNIQUE INDEX IF NOT EXISTS publisher_posts_slug_unique
  ON public.publisher_posts (slug)
  WHERE slug IS NOT NULL;

-- Fast lookup by slug (used by the SSR function for article pages)
CREATE INDEX IF NOT EXISTS idx_publisher_posts_slug
  ON public.publisher_posts (slug)
  WHERE status = 'approved';

-- ── Back-fill slugs for any existing approved rows that have none ─────────────
-- Uses title + short id suffix to guarantee uniqueness (no date prefix).
UPDATE public.publisher_posts
  SET slug = LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  ) || '-' || SUBSTRING(id::text, 1, 8)
  WHERE slug IS NULL
    AND status IN ('approved', 'pending');

-- ── category constraint ───────────────────────────────────────────────────────
-- Enforce the 6 canonical slugs at the DB level.
-- 'draft' rows may still have NULL category until the user picks one.
ALTER TABLE public.publisher_posts
  DROP CONSTRAINT IF EXISTS publisher_posts_category_check;

ALTER TABLE public.publisher_posts
  ADD CONSTRAINT publisher_posts_category_check
    CHECK (
      category IS NULL
      OR category IN ('study-tips', 'exam-updates', 'guide', 'scholarships', 'school-news')
    );

-- ── Fast listing index ────────────────────────────────────────────────────────
-- Used by the SSR function's category listing query:
-- SELECT ... WHERE status='approved' AND category='study-tips' ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_publisher_posts_listing
  ON public.publisher_posts (status, category, created_at DESC)
  WHERE status = 'approved';
