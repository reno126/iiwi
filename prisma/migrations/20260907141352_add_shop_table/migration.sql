/*
  Warnings:

  - Made the column `rate_avg` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rate_count` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "shop_id" TEXT,
ALTER COLUMN "rate_avg" SET NOT NULL,
ALTER COLUMN "rate_count" SET NOT NULL;

-- CreateTable
CREATE TABLE "shop" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(24),
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shop_name_key" ON "shop"("name");

-- CreateIndex
CREATE UNIQUE INDEX "shop_logo_key" ON "shop"("logo");

-- CreateIndex
CREATE INDEX "Product_shop_id_idx" ON "Product"("shop_id");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
