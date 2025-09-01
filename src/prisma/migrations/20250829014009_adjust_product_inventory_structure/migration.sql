/*
  Warnings:

  - You are about to drop the column `storeId` on the `Product` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_storeId_fkey";

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "storeId";
