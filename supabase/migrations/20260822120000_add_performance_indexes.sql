-- Migration to add performance indexes for foreign keys and sorted columns
CREATE INDEX IF NOT EXISTS idx_mattresses_material_id ON public.mattresses(material_id);
CREATE INDEX IF NOT EXISTS idx_product_images_mattress_id ON public.product_images(mattress_id);
CREATE INDEX IF NOT EXISTS idx_variants_mattress_id ON public.variants(mattress_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON public.inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_inquiry_items_inquiry_id ON public.inquiry_items(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_items_variant_id ON public.inquiry_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
