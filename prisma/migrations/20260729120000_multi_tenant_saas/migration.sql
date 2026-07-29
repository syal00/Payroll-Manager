-- Multi-tenant SaaS: Company model, company scoping on User/Employee, Employee.supervisorId,
-- SUPER_ADMIN / SUPERVISOR roles. Backfills one default Company for pre-existing data so
-- nothing breaks post-migration.

-- 1. Company table
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_url" TEXT,
    "primary_color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- 2. Seed a default company and backfill all existing tenant data onto it, so
-- existing User/Employee rows keep working once company_id becomes meaningful.
INSERT INTO "Company" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES ('00000000-0000-4000-8000-000000000001', 'Default Company', 'default', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. User.company_id
ALTER TABLE "User" ADD COLUMN "company_id" TEXT;

UPDATE "User" SET "company_id" = '00000000-0000-4000-8000-000000000001' WHERE "company_id" IS NULL;

ALTER TABLE "User" ADD CONSTRAINT "User_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "User_company_id_idx" ON "User"("company_id");

-- company_id may only be NULL for SUPER_ADMIN (cross-tenant) users; enforced in the DB as a
-- backstop to the application-level check in lib/roles.ts / lib/session.ts.
ALTER TABLE "User" ADD CONSTRAINT "User_company_required_unless_super_admin" CHECK ("role" = 'SUPER_ADMIN' OR "company_id" IS NOT NULL);

-- 4. Employee.company_id
ALTER TABLE "Employee" ADD COLUMN "company_id" TEXT;

UPDATE "Employee" SET "company_id" = '00000000-0000-4000-8000-000000000001' WHERE "company_id" IS NULL;

ALTER TABLE "Employee" ADD CONSTRAINT "Employee_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Employee_company_id_idx" ON "Employee"("company_id");

-- 5. Employee.supervisor_id (second-level scoping alongside the existing manager_user_id)
ALTER TABLE "Employee" ADD COLUMN "supervisor_id" TEXT;

ALTER TABLE "Employee" ADD CONSTRAINT "Employee_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Employee_supervisor_id_idx" ON "Employee"("supervisor_id");
