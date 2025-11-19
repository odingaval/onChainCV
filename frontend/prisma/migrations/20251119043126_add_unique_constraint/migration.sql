/*
  Warnings:

  - A unique constraint covering the columns `[tokenId,userProfileId]` on the table `Credential` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Credential_tokenId_userProfileId_key" ON "Credential"("tokenId", "userProfileId");
