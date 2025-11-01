-- Create table
CREATE TABLE IF NOT EXISTS public.images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  original_filename TEXT,
  alt_text TEXT,
  width INTEGER,
  height INTEGER,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Owner-only RLS policies
CREATE POLICY "Users can read their own images"
  ON public.images FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload images"
  ON public.images FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their images"
  ON public.images FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their images"
  ON public.images FOR DELETE TO authenticated
  USING (auth.uid() = user_id);