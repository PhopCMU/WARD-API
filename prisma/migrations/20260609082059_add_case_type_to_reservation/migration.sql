/*
  Warnings:

  - Added the required column `hnOwner` to the `patients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hnOwner` to the `reservations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "caseType" AS ENUM ('NORMAL', 'VIP');

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "hnOwner" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "caseType" "caseType" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "hnOwner" TEXT NOT NULL;
