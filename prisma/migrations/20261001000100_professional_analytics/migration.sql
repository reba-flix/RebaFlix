-- Additive only. Existing counters, history, and analytics events remain untouched.
ALTER TABLE "AnalyticsEvent"
  ADD COLUMN "dedupeKey" TEXT,
  ADD COLUMN "contentId" TEXT,
  ADD COLUMN "parentId" TEXT,
  ADD COLUMN "viewerKey" TEXT,
  ADD COLUMN "device" TEXT;
CREATE UNIQUE INDEX "AnalyticsEvent_dedupeKey_key" ON "AnalyticsEvent"("dedupeKey");
CREATE INDEX "AnalyticsEvent_contentId_name_createdAt_idx" ON "AnalyticsEvent"("contentId", "name", "createdAt");
CREATE INDEX "AnalyticsEvent_parentId_name_createdAt_idx" ON "AnalyticsEvent"("parentId", "name", "createdAt");
CREATE INDEX "AnalyticsEvent_viewerKey_name_createdAt_idx" ON "AnalyticsEvent"("viewerKey", "name", "createdAt");
CREATE TABLE "ViewingSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "viewerKey" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "duration" DOUBLE PRECISION NOT NULL,
  "seconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "coveredSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ranges" JSONB NOT NULL DEFAULT '[]',
  "sequence" INTEGER NOT NULL DEFAULT 0,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "ViewingSession_createdAt_idx" ON "ViewingSession"("createdAt");
CREATE INDEX "ViewingSession_contentId_createdAt_idx" ON "ViewingSession"("contentId", "createdAt");
CREATE INDEX "ViewingSession_parentId_createdAt_idx" ON "ViewingSession"("parentId", "createdAt");
CREATE INDEX "ViewingSession_viewerKey_updatedAt_idx" ON "ViewingSession"("viewerKey", "updatedAt");
