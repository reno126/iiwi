-- AlterTable
ALTER TABLE "shop" ADD COLUMN     "matcher_keys" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "shop_matcher_keys_idx" ON "shop" USING GIN ("matcher_keys");
