CREATE TABLE "AbuseBucket" (
    "key" TEXT NOT NULL,
    "used" INTEGER NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "AbuseBucket_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "OperationLease" (
    "key" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "OperationLease_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "ScrapeCache" (
    "key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "ScrapeCache_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "AbuseBucket_expiresAt_idx" ON "AbuseBucket"("expiresAt");
CREATE INDEX "OperationLease_expiresAt_idx" ON "OperationLease"("expiresAt");
CREATE INDEX "ScrapeCache_expiresAt_idx" ON "ScrapeCache"("expiresAt");
