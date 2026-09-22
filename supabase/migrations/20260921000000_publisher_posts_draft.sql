-- Migration: extend publisher_posts for auto-draft + SEO metadata
-- Adds columns required for:
--   1. Auto-draft (draft_content JSONB, last_saved_at)
--   2. SEO metadata (description, intro, tags, category)
--   3. Final rendered HTML cache (rendered_html for R2 upload source)

-- ── Draft storage ─────────────────────────────────────────────────────────────
-- draft_content stores the raw editor payload as JSONB so we can restore it
-- exactly (title, description, heroImage, intro, content, category, tags).
alter table public.publisher_posts
  add column if not exists draft_content jsonb default null;

-- last_saved_at is updated on every auto-save so the UI can show "Saved 2s ago"
alter table public.publisher_posts
  add column if not exists last_saved_at timestamp with time zone default null;

-- ── SEO metadata ──────────────────────────────────────────────────────────────
-- These are promoted out of draft_content so editors and the approval trigger
-- can query them without parsing JSON.
alter table public.publisher_posts
  add column if not exists description text default null;

alter table public.publisher_posts
  add column if not exists intro text default null;

alter table public.publisher_posts
  add column if not exists category text default null;

alter table public.publisher_posts
  add column if not exists tags text[] default '{}';

-- ── Rendered HTML ─────────────────────────────────────────────────────────────
-- The post-submission Edge Function stores the fully-rendered SEO HTML here.
-- The approval trigger then reads this column and uploads it to R2.
-- This avoids a second round-trip to GitHub CDN and guarantees the HTML
-- that went through review is exactly what lands in R2.
alter table public.publisher_posts
  add column if not exists rendered_html text default null;

-- ── RLS: allow publishers to update their own drafts ─────────────────────────
-- (The existing INSERT policy already covers new rows;
--  we need an UPDATE policy for auto-save upserts on existing draft rows.)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'publisher_posts'
      and policyname = 'Publishers can update their own drafts'
  ) then
    create policy "Publishers can update their own drafts"
      on public.publisher_posts for update
      using (auth.uid() = publisher_id)
      with check (
        auth.uid() = publisher_id
        -- publishers may only keep a post in draft/pending; editors handle approved/rejected
        and status in ('draft', 'pending')
      );
  end if;
end$$;

-- Ensure 'draft' is a valid status value alongside the existing ones
alter table public.publisher_posts
  drop constraint if exists publisher_posts_status_check;

alter table public.publisher_posts
  add constraint publisher_posts_status_check
    check (status in ('draft', 'pending', 'approved', 'rejected'));

-- Back-fill existing rows that have no status (edge case guard)
update public.publisher_posts
  set status = 'pending'
  where status is null;
