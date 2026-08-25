-- Drop the previous JWT-based admin policies (may not exist yet — ignore errors)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile role" ON public.profiles;

-- Allow any authenticated user whose profile.role = 'admin' to SELECT all rows
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow any authenticated user whose profile.role = 'admin' to UPDATE any row (including role column)
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow any authenticated user whose profile.role = 'admin' to INSERT new profile rows
CREATE POLICY "Admins can insert all profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow any authenticated user whose profile.role = 'admin' to DELETE any profile row
CREATE POLICY "Admins can delete all profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
