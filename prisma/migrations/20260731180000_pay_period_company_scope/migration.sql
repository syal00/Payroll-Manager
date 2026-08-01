-- Scope pay periods per company; dedupe identical windows and re-link child rows.

ALTER TABLE "PayPeriod" ADD COLUMN "company_id" TEXT;

UPDATE "PayPeriod" pp
SET "company_id" = sub."company_id"
FROM (
  SELECT DISTINCT ON (t."payPeriodId")
    t."payPeriodId",
    e."company_id"
  FROM "Timesheet" t
  INNER JOIN "Employee" e ON e.id = t."employeeId"
  WHERE e."company_id" IS NOT NULL
  ORDER BY t."payPeriodId", t."createdAt" DESC
) sub
WHERE pp.id = sub."payPeriodId" AND pp."company_id" IS NULL;

UPDATE "PayPeriod" pp
SET "company_id" = sub."company_id"
FROM (
  SELECT DISTINCT ON (p."payPeriodId")
    p."payPeriodId",
    e."company_id"
  FROM "Payslip" p
  INNER JOIN "Employee" e ON e.id = p."employeeId"
  WHERE e."company_id" IS NOT NULL
  ORDER BY p."payPeriodId", p."createdAt" DESC
) sub
WHERE pp.id = sub."payPeriodId" AND pp."company_id" IS NULL;

UPDATE "PayPeriod"
SET "company_id" = (SELECT id FROM "Company" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "company_id" IS NULL;

-- Re-point timesheets/payslips from duplicate periods to the canonical row per company + window.
WITH ranked AS (
  SELECT
    id,
    "company_id",
    "startDate",
    "endDate",
    ROW_NUMBER() OVER (
      PARTITION BY "company_id", "startDate", "endDate"
      ORDER BY "isCurrent" DESC, "createdAt" ASC
    ) AS rn
  FROM "PayPeriod"
),
keepers AS (
  SELECT id AS keep_id, "company_id", "startDate", "endDate"
  FROM ranked
  WHERE rn = 1
),
dupes AS (
  SELECT id AS dupe_id, "company_id", "startDate", "endDate"
  FROM ranked
  WHERE rn > 1
)
UPDATE "Timesheet" t
SET "payPeriodId" = k.keep_id
FROM dupes d
INNER JOIN keepers k
  ON k."company_id" = d."company_id"
 AND k."startDate" = d."startDate"
 AND k."endDate" = d."endDate"
WHERE t."payPeriodId" = d.dupe_id
  AND NOT EXISTS (
    SELECT 1
    FROM "Timesheet" existing
    WHERE existing."employeeId" = t."employeeId"
      AND existing."payPeriodId" = k.keep_id
      AND existing.id <> t.id
  );

WITH ranked AS (
  SELECT
    id,
    "company_id",
    "startDate",
    "endDate",
    ROW_NUMBER() OVER (
      PARTITION BY "company_id", "startDate", "endDate"
      ORDER BY "isCurrent" DESC, "createdAt" ASC
    ) AS rn
  FROM "PayPeriod"
),
keepers AS (
  SELECT id AS keep_id, "company_id", "startDate", "endDate"
  FROM ranked
  WHERE rn = 1
),
dupes AS (
  SELECT id AS dupe_id, "company_id", "startDate", "endDate"
  FROM ranked
  WHERE rn > 1
)
UPDATE "Payslip" p
SET "payPeriodId" = k.keep_id
FROM dupes d
INNER JOIN keepers k
  ON k."company_id" = d."company_id"
 AND k."startDate" = d."startDate"
 AND k."endDate" = d."endDate"
WHERE p."payPeriodId" = d.dupe_id;

DELETE FROM "PayPeriod" pp
WHERE pp.id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY "company_id", "startDate", "endDate"
        ORDER BY "isCurrent" DESC, "createdAt" ASC
      ) AS rn
    FROM "PayPeriod"
  ) ranked
  WHERE rn > 1
);

-- One current period per company (newest window wins).
WITH ranked_current AS (
  SELECT
    id,
    "company_id",
    ROW_NUMBER() OVER (
      PARTITION BY "company_id"
      ORDER BY "startDate" DESC, "createdAt" DESC
    ) AS rn
  FROM "PayPeriod"
  WHERE "isCurrent" = true
)
UPDATE "PayPeriod" pp
SET "isCurrent" = false
FROM ranked_current rc
WHERE pp.id = rc.id AND rc.rn > 1;

ALTER TABLE "PayPeriod" ALTER COLUMN "company_id" SET NOT NULL;

ALTER TABLE "PayPeriod"
  ADD CONSTRAINT "PayPeriod_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "PayPeriod_company_id_startDate_endDate_key"
  ON "PayPeriod"("company_id", "startDate", "endDate");

CREATE INDEX "PayPeriod_company_id_isCurrent_idx"
  ON "PayPeriod"("company_id", "isCurrent");
