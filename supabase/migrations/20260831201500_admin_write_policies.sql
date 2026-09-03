-- Drop policies if they already exist
DROP POLICY IF EXISTS "Admins can insert materials" ON public.materials;
DROP POLICY IF EXISTS "Admins can update materials" ON public.materials;
DROP POLICY IF EXISTS "Admins can delete materials" ON public.materials;

DROP POLICY IF EXISTS "Admins can insert mattresses" ON public.mattresses;
DROP POLICY IF EXISTS "Admins can update mattresses" ON public.mattresses;
DROP POLICY IF EXISTS "Admins can delete mattresses" ON public.mattresses;

DROP POLICY IF EXISTS "Admins can insert product_images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can update product_images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can delete product_images" ON public.product_images;

DROP POLICY IF EXISTS "Admins can insert variants" ON public.variants;
DROP POLICY IF EXISTS "Admins can update variants" ON public.variants;
DROP POLICY IF EXISTS "Admins can delete variants" ON public.variants;

-- Materials policies
CREATE POLICY "Admins can insert materials" ON public.materials
  FOR INSERT TO authenticated WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update materials" ON public.materials
  FOR UPDATE TO authenticated USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  ) WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete materials" ON public.materials
  FOR DELETE TO authenticated USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Mattresses policies
CREATE POLICY "Admins can insert mattresses" ON public.mattresses
  FOR INSERT TO authenticated WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update mattresses" ON public.mattresses
  FOR UPDATE TO authenticated USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  ) WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete mattresses" ON public.mattresses
  FOR DELETE TO authenticated USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Product Images policies
CREATE POLICY "Admins can insert product_images" ON public.product_images
  FOR INSERT TO authenticated WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update product_images" ON public.product_images
  FOR UPDATE TO authenticated USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  ) WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete product_images" ON public.product_images
  FOR DELETE TO authenticated USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Variants policies
CREATE POLICY "Admins can insert variants" ON public.variants
  FOR INSERT TO authenticated WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update variants" ON public.variants
  FOR UPDATE TO authenticated USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  ) WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete variants" ON public.variants
  FOR DELETE TO authenticated USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
