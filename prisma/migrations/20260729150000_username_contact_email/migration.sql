-- Split login username from deliverable contact email on User and Employee.

-- User: rename email → contact_email, add username
ALTER TABLE "User" RENAME COLUMN "email" TO "contact_email";
ALTER TABLE "User" ADD COLUMN "username" TEXT;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Employee: rename email → contact_email, add username
ALTER TABLE "Employee" RENAME COLUMN "email" TO "contact_email";
ALTER TABLE "Employee" ADD COLUMN "username" TEXT;
CREATE UNIQUE INDEX "Employee_username_key" ON "Employee"("username");
