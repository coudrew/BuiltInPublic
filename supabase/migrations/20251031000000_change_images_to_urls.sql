-- Change primary_image and gallery_images back to TEXT to store URLs instead of UUIDs
ALTER TABLE projects
DROP CONSTRAINT IF EXISTS projects_primary_image_fkey;

ALTER TABLE projects
ALTER COLUMN primary_image TYPE TEXT USING primary_image::TEXT;

ALTER TABLE projects
ALTER COLUMN gallery_images TYPE TEXT[] USING gallery_images::TEXT[];
