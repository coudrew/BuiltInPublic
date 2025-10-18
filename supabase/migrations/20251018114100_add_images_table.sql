-- Add images table + RLS (owner-only)

-- Create table
CREATE TABLE IF NOT EXISTS "public"."images" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "public"."profiles" ("id") ON DELETE CASCADE,
  "bucket" TEXT NOT NULL DEFAULT 'public',
  "path" TEXT NOT NULL,
  "original_filename" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "size_bytes" BIGINT,
  "alt_text" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "images_bucket_path_unique" UNIQUE ("bucket", "path")
);

-- (optional, consistent with your file)
ALTER TABLE "public"."images" OWNER TO "postgres";

-- Indexes
CREATE INDEX IF NOT EXISTS "images_user_id_idx"     ON "public"."images" ("user_id");
CREATE INDEX IF NOT EXISTS "images_created_at_idx"  ON "public"."images" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "images_bucket_path_idx" ON "public"."images" ("bucket", "path");

-- Enable RLS
ALTER TABLE "public"."images" ENABLE ROW LEVEL SECURITY;

-- RLS policies (owner-only)
CREATE POLICY "Users can read their own images"
  ON "public"."images" FOR SELECT TO "authenticated"
  USING (auth.uid() = "user_id");

CREATE POLICY "Users can upload images"
  ON "public"."images" FOR INSERT TO "authenticated"
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "Users can update their images"
  ON "public"."images" FOR UPDATE TO "authenticated"
  USING (auth.uid() = "user_id");

CREATE POLICY "Users can delete their images"
  ON "public"."images" FOR DELETE TO "authenticated"
  USING (auth.uid() = "user_id");

 CREATE POLICY "Anyone can read public-bucket images"
  ON "public"."images" FOR SELECT TO "authenticated"
  USING ("bucket" = 'public'); 