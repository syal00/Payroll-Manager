-- Lightweight daily API request counter for super-admin usage monitoring.

CREATE TABLE "UsageDaily" (
    "date" DATE NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UsageDaily_pkey" PRIMARY KEY ("date")
);
