-- Allow anyone (including unauthenticated users and Googlebot) to read
-- approved articles. This is required for:
--   1. The Edge SSR blog function (uses anon key)
--   2. The blog listing and content pages
--   3. Google Search indexing

CREATE POLICY "Public can read approved posts"
  ON public.publisher_posts
  FOR SELECT
  USING (status = 'approved');
