-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "actorSub" TEXT NOT NULL,
    "actorEmail" TEXT,
    "tenantId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "status" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Engagement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "clientName" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "testingType" TEXT NOT NULL,
    "methodology" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "logoUrl" TEXT,
    "brandColor" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Engagement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Engagement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Engagement" ("brandColor", "clientName", "createdAt", "frameworkId", "id", "language", "logoUrl", "methodology", "projectName", "scope", "templateId", "testingType", "updatedAt", "userId") SELECT "brandColor", "clientName", "createdAt", "frameworkId", "id", "language", "logoUrl", "methodology", "projectName", "scope", "templateId", "testingType", "updatedAt", "userId" FROM "Engagement";
DROP TABLE "Engagement";
ALTER TABLE "new_Engagement" RENAME TO "Engagement";
CREATE INDEX "Engagement_tenantId_createdAt_idx" ON "Engagement"("tenantId", "createdAt" DESC);
CREATE INDEX "Engagement_userId_createdAt_idx" ON "Engagement"("userId", "createdAt" DESC);
CREATE TABLE "new_Finding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engagementId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "controlId" TEXT,
    "description" TEXT,
    "impact" TEXT,
    "evidence" TEXT,
    "recommendation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Finding_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Finding_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Finding" ("controlId", "createdAt", "description", "engagementId", "evidence", "id", "impact", "recommendation", "severity", "title") SELECT "controlId", "createdAt", "description", "engagementId", "evidence", "id", "impact", "recommendation", "severity", "title" FROM "Finding";
DROP TABLE "Finding";
ALTER TABLE "new_Finding" RENAME TO "Finding";
CREATE INDEX "Finding_tenantId_createdAt_idx" ON "Finding"("tenantId", "createdAt" DESC);
CREATE INDEX "Finding_engagementId_idx" ON "Finding"("engagementId");
CREATE TABLE "new_FindingTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "controlId" TEXT,
    "description" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "category" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FindingTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FindingTemplate" ("category", "controlId", "createdAt", "description", "id", "impact", "language", "recommendation", "severity", "title") SELECT "category", "controlId", "createdAt", "description", "id", "impact", "language", "recommendation", "severity", "title" FROM "FindingTemplate";
DROP TABLE "FindingTemplate";
ALTER TABLE "new_FindingTemplate" RENAME TO "FindingTemplate";
CREATE INDEX "FindingTemplate_tenantId_language_category_idx" ON "FindingTemplate"("tenantId", "language", "category");
CREATE INDEX "FindingTemplate_language_category_idx" ON "FindingTemplate"("language", "category");
CREATE TABLE "new_Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engagementId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "markdown" TEXT NOT NULL,
    "pdfPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Report_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Report" ("createdAt", "engagementId", "id", "markdown", "pdfPath") SELECT "createdAt", "engagementId", "id", "markdown", "pdfPath" FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";
CREATE INDEX "Report_tenantId_createdAt_idx" ON "Report"("tenantId", "createdAt" DESC);
CREATE INDEX "Report_engagementId_idx" ON "Report"("engagementId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "roles" TEXT NOT NULL DEFAULT '["viewer"]',
    "authProvider" TEXT NOT NULL DEFAULT 'local',
    "oidcIssuer" TEXT,
    "oidcSubject" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_User" ("company", "createdAt", "email", "id", "name", "password") SELECT "company", "createdAt", "email", "id", "name", "password" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE UNIQUE INDEX "User_oidcIssuer_oidcSubject_key" ON "User"("oidcIssuer", "oidcSubject");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_actorSub_createdAt_idx" ON "AuditLog"("actorSub", "createdAt" DESC);
