/*
  Warnings:

  - Made the column `rate_avg` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "rate_avg" SET NOT NULL;
