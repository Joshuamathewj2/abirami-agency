-- ==============================================================================
-- MIGRATION: Create Reviews Table (with Owner permissions for Edit/Delete)
-- Abirami Agency - Parryware Sanitaryware
--
-- PURPOSE:
-- Stores customer ratings & testimonials submitted via "Write a Review" on the storefront.
-- Allows instant display or moderation by status ('approved', 'pending', 'rejected').
-- Supports Edit and Delete permissions for review owners and store administrators.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    TEXT DEFAULT 'general',
  user_id       TEXT,                             -- Supabase auth user UUID (if logged in)
  user_email    TEXT,                             -- Reviewer account email (if logged in)
  reviewer_name TEXT NOT NULL,
  rating        INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title         TEXT,
  body          TEXT NOT NULL,
  location      TEXT DEFAULT 'Chennai',
  status        TEXT NOT NULL DEFAULT 'approved', -- 'approved' | 'pending' | 'rejected'
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- If table already existed previously without user_id or user_email, add them safely
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'user_id') THEN
    ALTER TABLE public.reviews ADD COLUMN user_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'user_email') THEN
    ALTER TABLE public.reviews ADD COLUMN user_email TEXT;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 1. Public can read approved reviews
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews"
  ON public.reviews FOR SELECT
  USING (status = 'approved');

-- 2. Anyone (including anonymous storefront visitors) can submit a review
DROP POLICY IF EXISTS "Public can submit reviews" ON public.reviews;
CREATE POLICY "Public can submit reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (true);

-- 3. Authenticated owners can update their own reviews
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = user_email)
  WITH CHECK (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = user_email);

-- 4. Authenticated owners can delete their own reviews
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = user_email);

-- 5. Authenticated admins can view, update, and moderate all reviews
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
CREATE POLICY "Admins can manage all reviews"
  ON public.reviews FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 6. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
