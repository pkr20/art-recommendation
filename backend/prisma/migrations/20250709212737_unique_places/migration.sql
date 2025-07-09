/*
  Warnings:

  - A unique constraint covering the columns `[placeId]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Favorite_placeId_key" ON "Favorite"("placeId");
