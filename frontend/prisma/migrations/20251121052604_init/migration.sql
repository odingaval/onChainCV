-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "username" TEXT,
    "displayName" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "customSlug" TEXT,
    "title" TEXT,
    "category" TEXT,
    "experience" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareSettings" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "showCredentials" BOOLEAN NOT NULL DEFAULT true,
    "showActivity" BOOLEAN NOT NULL DEFAULT true,
    "showWalletAddress" BOOLEAN NOT NULL DEFAULT true,
    "allowSearch" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "schemaId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "issuedAtBlock" INTEGER NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAtBlock" INTEGER,
    "userProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_walletAddress_key" ON "UserProfile"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_username_key" ON "UserProfile"("username");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_customSlug_key" ON "UserProfile"("customSlug");

-- CreateIndex
CREATE UNIQUE INDEX "ShareSettings_userProfileId_key" ON "ShareSettings"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_tokenId_issuer_key" ON "Credential"("tokenId", "issuer");

-- AddForeignKey
ALTER TABLE "ShareSettings" ADD CONSTRAINT "ShareSettings_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
