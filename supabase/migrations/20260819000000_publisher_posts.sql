create table public.publisher_posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  topics text[] default '{}',
  thumbnail_url text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  github_url text,
  cloudflare_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  publisher_id uuid references auth.users(id) on delete set null
);

-- RLS policies
alter table public.publisher_posts enable row level security;

create policy "Publishers can insert their own posts"
  on public.publisher_posts for insert
  with check (auth.uid() = publisher_id);

create policy "Publishers can view their own posts"
  on public.publisher_posts for select
  using (auth.uid() = publisher_id);

-- Webhook Trigger Function for Approval
create or replace function public.handle_post_approval()
returns trigger as $$
begin
  if new.status = 'approved' and old.status = 'pending' then
    -- We can use pg_net if installed, or edge function webhook
    -- Here we invoke an Edge Function using the built-in pg_net if possible,
    -- or we assume the webhook is configured in the Supabase Dashboard
    -- For simplicity, we just trigger a generic notify which can be picked up,
    -- or better yet, assume we will configure a Database Webhook in the Supabase UI
    -- or use http extension.
    null;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_post_approved
  after update on public.publisher_posts
  for each row execute function public.handle_post_approval();
