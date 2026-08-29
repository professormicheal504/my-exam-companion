alter table public.publisher_posts
add column rejection_reason text;

create policy "Editors can view all posts"
  on public.publisher_posts for select
  using (
    auth.jwt()->>'email' in ('professormicheal504@gmail.com', 'prepzone504@gmail.com')
  );

create policy "Editors can update all posts"
  on public.publisher_posts for update
  using (
    auth.jwt()->>'email' in ('professormicheal504@gmail.com', 'prepzone504@gmail.com')
  )
  with check (
    auth.jwt()->>'email' in ('professormicheal504@gmail.com', 'prepzone504@gmail.com')
  );
