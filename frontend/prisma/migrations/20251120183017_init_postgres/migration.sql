-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "username" TEXT,
    "displayName" TEXT,
    "name" TEXT,
    "title" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "customSlug" TEXT,
    "category" TEXT,
    "experience" TEXT,
    "skills" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "cid" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "gatewayUrl" TEXT NOT NULL,
    "issuedAtBlock" TEXT NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAtBlock" TEXT,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareSettings" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "showCredentials" BOOLEAN NOT NULL DEFAULT true,
    "showActivity" BOOLEAN NOT NULL DEFAULT true,
    "showWalletAddress" BOOLEAN NOT NULL DEFAULT false,
    "allowSearch" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_walletAddress_key" ON "UserProfile"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_username_key" ON "UserProfile"("username");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_customSlug_key" ON "UserProfile"("customSlug");

-- CreateIndex
CREATE INDEX "UserProfile_walletAddress_idx" ON "UserProfile"("walletAddress");

-- CreateIndex
CREATE INDEX "UserProfile_username_idx" ON "UserProfile"("username");

-- CreateIndex
CREATE INDEX "UserProfile_customSlug_idx" ON "UserProfile"("customSlug");

-- CreateIndex
CREATE INDEX "UserProfile_isPublic_idx" ON "UserProfile"("isPublic");

-- CreateIndex
CREATE INDEX "UserProfile_category_idx" ON "UserProfile"("category");

-- CreateIndex
CREATE INDEX "UserProfile_experience_idx" ON "UserProfile"("experience");

-- CreateIndex
CREATE INDEX "Credential_tokenId_idx" ON "Credential"("tokenId");

-- CreateIndex
CREATE INDEX "Credential_subject_idx" ON "Credential"("subject");

-- CreateIndex
CREATE INDEX "Credential_userProfileId_idx" ON "Credential"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_tokenId_userProfileId_key" ON "Credential"("tokenId", "userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ShareSettings_userProfileId_key" ON "ShareSettings"("userProfileId");
