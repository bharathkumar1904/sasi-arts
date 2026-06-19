-- Run this in Supabase SQL Editor to set up image storage
-- Creates a public bucket for product/user images

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('products', 'products', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Allow anonymous uploads (for admin panel and product builder)
CREATE POLICY "Public upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products');
CREATE POLICY "Public select" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Public update" ON storage.objects FOR UPDATE USING (bucket_id = 'products');
CREATE POLICY "Public delete" ON storage.objects FOR DELETE USING (bucket_id = 'products');
