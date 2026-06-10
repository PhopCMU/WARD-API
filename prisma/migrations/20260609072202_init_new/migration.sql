-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF', 'USER');

-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('MEDICINE', 'SURGERY', 'SPECIALIST', 'EMERGENCY', 'OPD', 'ICU', 'WARD');

-- CreateEnum
CREATE TYPE "LineGroup" AS ENUM ('MEDICINE', 'SPECIALIST', 'SURGERY', 'WARD');

-- CreateEnum
CREATE TYPE "TypeRoom" AS ENUM ('CCU', 'DOG_NON_INFECTIOUS', 'CAT_CLEAN', 'CAT_QUARANTINE', 'CAT_GI_INFECTIOUS', 'CAT_RESP_INFECTIOUS', 'DOG_GI_INFECTIOUS', 'DOG_RESP_INFECTIOUS', 'RECOVERY');

-- CreateEnum
CREATE TYPE "CageType" AS ENUM ('PAVILION', 'UNDER_10KG', 'KG_10_TO_20', 'OVER_20KG', 'UNLIMITED');

-- CreateEnum
CREATE TYPE "AuditModule" AS ENUM ('AUTH', 'USER', 'ROOM', 'CAGE', 'PATIENT', 'RESERVATION', 'WARD');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'RESERVE_CAGE', 'CANCEL_RESERVATION', 'MOVE_CAGE', 'ADMIT', 'DISCHARGE', 'TRANSFER_CASE', 'CHANGE_STATUS');

-- CreateEnum
CREATE TYPE "Species" AS ENUM ('DOG', 'CAT');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('RESERVED', 'ADMITTED', 'DISCHARGED', 'CANCELLED');

-- CreateTable
CREATE TABLE "line_group_officials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "groupId" TEXT NOT NULL,
    "groupName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "line_group_officials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmu_it_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cmuId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "unit" "Unit",
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "cmu_it_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hn" TEXT NOT NULL,
    "animalName" TEXT NOT NULL,
    "species" "Species" NOT NULL,
    "breed" TEXT,
    "sex" TEXT,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "roomType" "TypeRoom" NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "roomId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "cageType" "CageType" NOT NULL,
    "hasOxygen" BOOLEAN NOT NULL DEFAULT false,
    "minWeightKg" DOUBLE PRECISION,
    "maxWeightKg" DOUBLE PRECISION,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "cages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patientId" UUID NOT NULL,
    "cageId" UUID NOT NULL,
    "sourceUnit" "Unit" NOT NULL,
    "referredById" UUID,
    "status" "ReservationStatus" NOT NULL DEFAULT 'RESERVED',
    "admitDate" TIMESTAMP(3) NOT NULL,
    "dischargeDate" TIMESTAMP(3),
    "diagnosis" TEXT,
    "note" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID,
    "module" "AuditModule" NOT NULL,
    "action" "AuditAction" NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "line_group_officials_groupId_key" ON "line_group_officials"("groupId");

-- CreateIndex
CREATE INDEX "line_group_officials_groupId_idx" ON "line_group_officials"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "cmu_it_accounts_cmuId_key" ON "cmu_it_accounts"("cmuId");

-- CreateIndex
CREATE UNIQUE INDEX "cmu_it_accounts_email_key" ON "cmu_it_accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "patients_hn_key" ON "patients"("hn");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_name_key" ON "rooms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "cages_code_key" ON "cages"("code");

-- CreateIndex
CREATE INDEX "cages_roomId_idx" ON "cages"("roomId");

-- CreateIndex
CREATE INDEX "reservations_patientId_idx" ON "reservations"("patientId");

-- CreateIndex
CREATE INDEX "reservations_cageId_idx" ON "reservations"("cageId");

-- CreateIndex
CREATE INDEX "reservations_sourceUnit_idx" ON "reservations"("sourceUnit");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_module_idx" ON "AuditLog"("module");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- AddForeignKey
ALTER TABLE "cages" ADD CONSTRAINT "cages_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_cageId_fkey" FOREIGN KEY ("cageId") REFERENCES "cages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "cmu_it_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "cmu_it_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "cmu_it_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
