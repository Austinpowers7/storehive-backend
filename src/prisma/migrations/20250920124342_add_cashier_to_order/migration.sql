-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "cashierId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
