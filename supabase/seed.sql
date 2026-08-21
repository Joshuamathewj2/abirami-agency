-- Insert Materials
INSERT INTO public.materials (id, name) VALUES 
  ('a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d', 'Memory Foam'),
  ('b2c3d4e5-f6a7-4b2c-9d3e-4f5a6b7c8d9e', 'Hybrid'),
  ('c3d4e5f6-a7b8-4c3d-ae4f-5a6b7c8d9e0f', 'Natural Latex')
ON CONFLICT (name) DO NOTHING;

-- Insert Mattresses
INSERT INTO public.mattresses (id, material_id, name, description, warranty_years, is_active, discount_percentage) VALUES 
  ('d4e5f6a7-b8c9-4d4e-bf5a-6b7c8d9e0f1a', 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d', 'The Cloud Rest', 'A plush memory foam mattress that contours to your body for pressure relief.', 10, true, 15),
  ('e5f6a7b8-c9d0-4e5f-c06b-7c8d9e0f1a2b', 'b2c3d4e5-f6a7-4b2c-9d3e-4f5a6b7c8d9e', 'The Dream Weaver Hybrid', 'Perfect blend of supportive coils and cooling memory foam.', 15, true, 0),
  ('f6a7b8c9-d0e1-4f6a-d17c-8d9e0f1a2b3c', 'c3d4e5f6-a7b8-4c3d-ae4f-5a6b7c8d9e0f', 'Eco Pure Latex', '100% natural, hypoallergenic latex for a breathable and bouncy sleep.', 20, true, 20)
ON CONFLICT (id) DO NOTHING;

-- Insert Product Images
INSERT INTO public.product_images (mattress_id, image_url, is_primary, sort_order) VALUES 
  ('d4e5f6a7-b8c9-4d4e-bf5a-6b7c8d9e0f1a', 'https://images.unsplash.com/photo-1505693416035-af855b400ea4?auto=format&fit=crop&w=800&q=80', true, 1),
  ('e5f6a7b8-c9d0-4e5f-c06b-7c8d9e0f1a2b', 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=800&q=80', true, 1),
  ('f6a7b8c9-d0e1-4f6a-d17c-8d9e0f1a2b3c', 'https://images.unsplash.com/photo-1582582621959-48d27397dc69?auto=format&fit=crop&w=800&q=80', true, 1);

-- Insert Variants for "The Cloud Rest" (Memory Foam)
INSERT INTO public.variants (mattress_id, size_name, length, width, height, price, stock, sku) VALUES 
  ('d4e5f6a7-b8c9-4d4e-bf5a-6b7c8d9e0f1a', 'Twin', 75, 38, 10, 499.00, 50, 'CLOUD-TWIN-10'),
  ('d4e5f6a7-b8c9-4d4e-bf5a-6b7c8d9e0f1a', 'Queen', 80, 60, 10, 799.00, 100, 'CLOUD-QUEEN-10'),
  ('d4e5f6a7-b8c9-4d4e-bf5a-6b7c8d9e0f1a', 'King', 80, 76, 10, 999.00, 30, 'CLOUD-KING-10');

-- Insert Variants for "The Dream Weaver Hybrid"
INSERT INTO public.variants (mattress_id, size_name, length, width, height, price, stock, sku) VALUES 
  ('e5f6a7b8-c9d0-4e5f-c06b-7c8d9e0f1a2b', 'Queen', 80, 60, 12, 1099.00, 80, 'DREAM-QUEEN-12'),
  ('e5f6a7b8-c9d0-4e5f-c06b-7c8d9e0f1a2b', 'King', 80, 76, 12, 1399.00, 40, 'DREAM-KING-12');

-- Insert Coupons
INSERT INTO public.coupons (code, percentage, flat_discount, min_order_value, usage_limit, is_active) VALUES 
  ('WELCOME10', 10.00, NULL, 500.00, 1000, true),
  ('FLAT100', NULL, 100.00, 1000.00, 500, true)
ON CONFLICT (code) DO NOTHING;
