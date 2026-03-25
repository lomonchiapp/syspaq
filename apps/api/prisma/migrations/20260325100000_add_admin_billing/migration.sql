-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('TRIAL', 'STARTER', 'GROWTH', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingMethod" AS ENUM ('AZUL', 'CASH', 'BANK_TRANSFER', 'CHECK', 'OTHER');

-- AlterTable Tenant: add billing fields
ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "plan"          "PlanTier"   NOT NULL DEFAULT 'TRIAL',
  ADD COLUMN IF NOT EXISTS "plan_status"   "PlanStatus" NOT NULL DEFAULT 'TRIALING',
  ADD COLUMN IF NOT EXISTS "trial_ends_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "period_start"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "period_end"    TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "admin_notes"   TEXT;

-- AlterTable User: add super admin flag
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "is_super_admin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable billing_records
CREATE TABLE IF NOT EXISTS "billing_records" (
    "id"           TEXT NOT NULL,
    "tenant_id"    TEXT NOT NULL,
    "amount"       DECIMAL(12,2) NOT NULL,
    "currency"     TEXT NOT NULL DEFAULT 'DOP',
    "method"       "BillingMethod" NOT NULL,
    "reference"    TEXT,
    "notes"        TEXT,
    "period_start" TIMESTAMP(3),
    "period_end"   TIMESTAMP(3),
    "recorded_by"  TEXT NOT NULL,
    "paid_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_records_pkey" PRIMARY KEY ("id")
);

-- Index
CREATE INDEX IF NOT EXISTS "billing_records_tenant_id_paid_at_idx" ON "billing_records"("tenant_id", "paid_at");

-- Foreign key
ALTER TABLE "billing_records"
  ADD CONSTRAINT "billing_records_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
