/*
  Warnings:

  - The values [CAT_CLEAN] on the enum `TypeRoom` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TypeRoom_new" AS ENUM ('CCU', 'DOG_NON_INFECTIOUS', 'CAT_NON_INFECTIOUS', 'CAT_QUARANTINE', 'CAT_GI_INFECTIOUS', 'CAT_RESP_INFECTIOUS', 'DOG_GI_INFECTIOUS', 'DOG_RESP_INFECTIOUS', 'RECOVERY');
ALTER TABLE "rooms" ALTER COLUMN "roomType" TYPE "TypeRoom_new" USING ("roomType"::text::"TypeRoom_new");
ALTER TYPE "TypeRoom" RENAME TO "TypeRoom_old";
ALTER TYPE "TypeRoom_new" RENAME TO "TypeRoom";
DROP TYPE "TypeRoom_old";
COMMIT;
