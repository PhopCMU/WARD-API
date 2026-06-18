/*
  Warnings:

  - You are about to drop the column `name` on the `rooms` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name_en]` on the table `rooms` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "rooms_name_key";

-- AlterTable
ALTER TABLE "rooms" DROP COLUMN "name",
ADD COLUMN     "name_en" TEXT,
ADD COLUMN     "name_th" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "rooms_name_en_key" ON "rooms"("name_en");
