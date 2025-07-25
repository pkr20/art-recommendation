/*
  Warnings:

  - A unique constraint covering the columns `[userId,placeId]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Favorite` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Favorite_placeId_key";

-- AlterTable
ALTER TABLE "Favorite" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_placeId_key" ON "Favorite"("userId", "placeId");
