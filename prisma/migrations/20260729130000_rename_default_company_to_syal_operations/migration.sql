-- Rename the bootstrap "default" company (created by the multi-tenant migration's backfill) to the
-- platform owner's real org. Super admin's own staff/employees now live in this Company row like any
-- other tenant — no special-casing. Idempotent no-op if the row is already renamed or absent.
UPDATE "Company"
SET "name" = 'Syal Operations', "slug" = 'syal-operations', "logo_url" = '/logo.png', "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'default';
