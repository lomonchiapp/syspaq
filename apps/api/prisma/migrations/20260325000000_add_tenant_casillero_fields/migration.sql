-- AlterTable: add casillero fields to Tenant
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "casillero_prefix" TEXT NOT NULL DEFAULT 'BLX';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "casillero_counter" INTEGER NOT NULL DEFAULT 0;
