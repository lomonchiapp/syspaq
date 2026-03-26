ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "portal_company_name"  TEXT,
  ADD COLUMN IF NOT EXISTS "portal_logo"          TEXT,
  ADD COLUMN IF NOT EXISTS "portal_primary_color" TEXT,
  ADD COLUMN IF NOT EXISTS "portal_bg_image"      TEXT,
  ADD COLUMN IF NOT EXISTS "portal_welcome_text"  TEXT;
