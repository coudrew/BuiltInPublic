-- Drop the existing policy first
DROP POLICY IF EXISTS "View project images" ON projects;

-- Recreate the policy with correct enum casting
CREATE POLICY "View project images"
  ON projects
  FOR SELECT
  USING (
    visibility = 'public'::project_visibility
    OR owner_id = auth.uid()
  );