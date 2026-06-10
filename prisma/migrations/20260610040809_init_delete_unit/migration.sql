/*
  Warnings:

  - The values [MOVE_CAGE] on the enum `AuditAction` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `unit` on the `cmu_it_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `sourceUnit` on the `reservations` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'RESERVE_CAGE', 'CANCEL_RESERVATION', 'EXTEND_RESERVATION', 'ADMIT', 'DISCHARGE', 'TRANSFER_CASE', 'CHANGE_STATUS');
ALTER TABLE "AuditLog" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "AuditAction_old";
COMMIT;

-- DropIndex
DROP INDEX "reservations_sourceUnit_idx";

-- AlterTable
ALTER TABLE "cmu_it_accounts" DROP COLUMN "unit";

-- AlterTable
ALTER TABLE "reservations" DROP COLUMN "sourceUnit";

-- DropEnum
DROP TYPE "Unit";
