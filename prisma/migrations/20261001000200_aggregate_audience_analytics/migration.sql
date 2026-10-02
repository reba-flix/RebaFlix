-- Review proposal only. This migration has NOT been applied.
-- Existing AnalyticsEvent, ViewingSession, and historical counters are untouched.
CREATE TABLE "ContentDailyAnalytics" (
  "date" DATE NOT NULL,
  "contentId" TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "contentType" TEXT NOT NULL CHECK ("contentType" IN ('movie', 'series', 'episode', 'part')),
  "deviceCategory" TEXT NOT NULL CHECK ("deviceCategory" IN ('desktop', 'mobile', 'tablet', 'other')),
  "viewCount" INTEGER NOT NULL DEFAULT 0 CHECK ("viewCount" >= 0),
  "downloadCount" INTEGER NOT NULL DEFAULT 0 CHECK ("downloadCount" >= 0),
  "watchSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK ("watchSeconds" >= 0),
  "playCount" INTEGER NOT NULL DEFAULT 0 CHECK ("playCount" >= 0),
  "completedCount" INTEGER NOT NULL DEFAULT 0 CHECK ("completedCount" >= 0),
  PRIMARY KEY ("date", "contentId", "deviceCategory")
);
CREATE INDEX "ContentDailyAnalytics_date_contentType_idx" ON "ContentDailyAnalytics"("date", "contentType");
CREATE INDEX "ContentDailyAnalytics_date_parentId_idx" ON "ContentDailyAnalytics"("date", "parentId");

-- Per-play ranges exist only during an active playback and expire within two minutes.
CREATE TABLE "AnalyticsPlaybackState" (
  "id" TEXT PRIMARY KEY,
  "contentId" TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "contentType" TEXT NOT NULL CHECK ("contentType" IN ('movie', 'episode', 'part')),
  "deviceCategory" TEXT NOT NULL CHECK ("deviceCategory" IN ('desktop', 'mobile', 'tablet', 'other')),
  "duration" DOUBLE PRECISION NOT NULL CHECK ("duration" > 0),
  "sequence" INTEGER NOT NULL DEFAULT 0,
  "ranges" JSONB NOT NULL DEFAULT '[]',
  "coveredSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "lastAcceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "AnalyticsPlaybackState_expiresAt_idx" ON "AnalyticsPlaybackState"("expiresAt");

-- Opaque 30-second action idempotency state. It is never joined to a visitor/account.
CREATE TABLE "AnalyticsActionDedupe" (
  "id" TEXT PRIMARY KEY,
  "actionKey" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "eventName" TEXT NOT NULL CHECK ("eventName" IN ('content_view', 'content_download')),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  UNIQUE ("actionKey", "contentId", "eventName")
);
CREATE INDEX "AnalyticsActionDedupe_expiresAt_idx" ON "AnalyticsActionDedupe"("expiresAt");
