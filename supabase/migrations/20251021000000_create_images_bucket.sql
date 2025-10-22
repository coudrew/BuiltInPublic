INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true, 
  10485760, -- 10MB limit
  ARRAY['image/webp', 'image/jpeg', 'image/png'] 
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Row Level Security Policies for 'images' bucket
-- ============================================================================

-- Policy 1: Users can INSERT only into their own folder

CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Users can UPDATE/DELETE only their own images

CREATE POLICY "Users can update own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Users can always READ their own images

CREATE POLICY "Users can view own images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Public can READ images via direct URL
CREATE POLICY "Public can view images via direct URL"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'images'
);


