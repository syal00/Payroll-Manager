-- Role & access model (Main Admin / Manager) + manager assignment + timesheet "under review" status

ALTER TABLE "User" ADD COLUMN "created_by_id" TEXT;

ALTER TABLE "Employee" ADD COLUMN "manager_user_id" TEXT;

ALTER TABLE "User" ADD CONSTRAINT "User_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Employee" ADD CONSTRAINT "Employee_manager_user_id_fkey" FOREIGN KEY ("manager_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Employee_manager_user_id_idx" ON "Employee"("manager_user_id");

UPDATE "Timesheet" SET status = 'UNDER_REVIEW' WHERE status = 'VERIFIED';

UPDATE "Approval" SET "newStatus" = 'UNDER_REVIEW' WHERE "newStatus" = 'VERIFIED';
UPDATE "Approval" SET "previousStatus" = 'UNDER_REVIEW' WHERE "previousStatus" = 'VERIFIED';

UPDATE "User" SET role = 'MAIN_ADMIN' WHERE role = 'ADMIN';

UPDATE "User" SET role = 'MANAGER' WHERE email = 'manager@syaloperations.com';
