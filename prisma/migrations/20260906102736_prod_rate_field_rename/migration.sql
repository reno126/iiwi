/*
  Warnings:

  - You are about to drop the column `rate_avg` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "rate_avg",
ADD COLUMN     "rate_avg" DOUBLE PRECISION,
ADD COLUMN     "rate_count" INTEGER;
