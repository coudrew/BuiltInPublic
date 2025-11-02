-- Add image fields to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS primary_image UUID references public.images (id),
ADD COLUMN IF NOT EXISTS gallery_images UUID[] default array[]::UUID[];

-- Add policies for image fields
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy for viewing project images (anyone can view public projects)
CREATE POLICY "View project images"
  ON projects
  FOR SELECT
  USING (
    visibility = 'public'::project_visibility
    OR owner_id = auth.uid()
  );

-- Policy for updating project images (only owner can update)
CREATE POLICY "Update project images"
  ON projects
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());