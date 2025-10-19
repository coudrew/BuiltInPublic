-- Add images table + RLS (owner-only)

-- Create table
CREATE TABLE IF NOT EXISTS "public"."images" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "public"."profiles" ("id") ON DELETE CASCADE,
  "path" TEXT NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "size_bytes" BIGINT,
  "alt_text" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

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