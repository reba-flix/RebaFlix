-- Initial RebaFlix PostgreSQL schema. Generated to mirror prisma/schema.prisma.
-- Run with: npx prisma migrate deploy

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "PlanInterval" AS ENUM ('MONTHLY', 'YEARLY');
CREATE TYPE "SubscriptionStatus" AS ENUM ('FREE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'PAYPAL');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'PUSH', 'IN_APP');
CREATE TYPE "ContentRating" AS ENUM ('G', 'PG', 'PG_13', 'R', 'NC_17', 'TV_Y', 'TV_G', 'TV_PG', 'TV_14', 'TV_MA');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "avatarUrl" TEXT,
  "locale" TEXT NOT NULL DEFAULT 'en',
  "rtl" BOOLEAN NOT NULL DEFAULT false,
  "lastSeenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Role" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL UNIQUE, "description" TEXT);
CREATE TABLE "Permission" ("id" TEXT PRIMARY KEY, "action" TEXT NOT NULL UNIQUE, "description" TEXT);
CREATE TABLE "UserRole" ("userId" TEXT NOT NULL, "roleId" TEXT NOT NULL, PRIMARY KEY ("userId","roleId"));
CREATE TABLE "RolePermission" ("roleId" TEXT NOT NULL, "permissionId" TEXT NOT NULL, PRIMARY KEY ("roleId","permissionId"));

CREATE TABLE "Person" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "photoUrl" TEXT,
  "biography" TEXT
);

CREATE TABLE "Movie" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "tagline" TEXT,
  "description" TEXT NOT NULL,
  "posterUrl" TEXT,
  "backdropUrl" TEXT,
  "trailerUrl" TEXT,
  "videoUrl" TEXT,
  "runtimeMinutes" INTEGER,
  "releaseDate" TIMESTAMP(3),
  "contentRating" "ContentRating",
  "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ratingCount" INTEGER NOT NULL DEFAULT 0,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "directorId" TEXT
);

CREATE TABLE "Series" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "tagline" TEXT,
  "description" TEXT NOT NULL,
  "posterUrl" TEXT,
  "backdropUrl" TEXT,
  "trailerUrl" TEXT,
  "contentRating" "ContentRating",
  "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ratingCount" INTEGER NOT NULL DEFAULT 0,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "directorId" TEXT
);

CREATE TABLE "Season" (
  "id" TEXT PRIMARY KEY,
  "seriesId" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "title" TEXT,
  "description" TEXT,
  "posterUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("seriesId","number")
);

CREATE TABLE "Episode" (
  "id" TEXT PRIMARY KEY,
  "seasonId" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "thumbnailUrl" TEXT,
  "videoUrl" TEXT,
  "runtimeMinutes" INTEGER,
  "releaseDate" TIMESTAMP(3),
  "published" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("seasonId","number")
);

CREATE TABLE "Genre" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL UNIQUE, "slug" TEXT NOT NULL UNIQUE);
CREATE TABLE "Category" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL UNIQUE, "slug" TEXT NOT NULL UNIQUE);
CREATE TABLE "Language" ("id" TEXT PRIMARY KEY, "code" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "nativeName" TEXT, "rtl" BOOLEAN NOT NULL DEFAULT false);

CREATE TABLE "LiveChannel" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "logoUrl" TEXT,
  "streamUrl" TEXT NOT NULL,
  "categoryId" TEXT,
  "languageId" TEXT,
  "drmEnabled" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Schedule" (
  "id" TEXT PRIMARY KEY,
  "liveChannelId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "rating" "ContentRating"
);

CREATE TABLE "MovieActor" ("movieId" TEXT NOT NULL, "personId" TEXT NOT NULL, "character" TEXT, "sortOrder" INTEGER NOT NULL DEFAULT 0, PRIMARY KEY ("movieId","personId"));
CREATE TABLE "SeriesActor" ("seriesId" TEXT NOT NULL, "personId" TEXT NOT NULL, "character" TEXT, "sortOrder" INTEGER NOT NULL DEFAULT 0, PRIMARY KEY ("seriesId","personId"));
CREATE TABLE "MovieGenre" ("movieId" TEXT NOT NULL, "genreId" TEXT NOT NULL, PRIMARY KEY ("movieId","genreId"));
CREATE TABLE "SeriesGenre" ("seriesId" TEXT NOT NULL, "genreId" TEXT NOT NULL, PRIMARY KEY ("seriesId","genreId"));
CREATE TABLE "MovieCategory" ("movieId" TEXT NOT NULL, "categoryId" TEXT NOT NULL, PRIMARY KEY ("movieId","categoryId"));
CREATE TABLE "SeriesCategory" ("seriesId" TEXT NOT NULL, "categoryId" TEXT NOT NULL, PRIMARY KEY ("seriesId","categoryId"));
CREATE TABLE "MovieLanguage" ("movieId" TEXT NOT NULL, "languageId" TEXT NOT NULL, PRIMARY KEY ("movieId","languageId"));

CREATE TABLE "Subtitle" (
  "id" TEXT PRIMARY KEY,
  "languageId" TEXT NOT NULL,
  "movieId" TEXT,
  "episodeId" TEXT,
  "label" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "default" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE "Subscription" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "planName" TEXT NOT NULL,
  "interval" "PlanInterval",
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'FREE',
  "priceCents" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "providerCustomerId" TEXT,
  "providerReferenceId" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "currentPeriodEnd" TIMESTAMP(3),
  "canceledAt" TIMESTAMP(3)
);

CREATE TABLE "Payment" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "subscriptionId" TEXT,
  "provider" "PaymentProvider" NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "reference" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Favorite" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "movieId" TEXT, "seriesId" TEXT, "episodeId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "History" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "movieId" TEXT, "episodeId" TEXT, "positionSeconds" INTEGER NOT NULL DEFAULT 0, "durationSeconds" INTEGER NOT NULL DEFAULT 0, "completed" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "WatchLater" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "movieId" TEXT, "seriesId" TEXT, "episodeId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "Comment" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "movieId" TEXT, "seriesId" TEXT, "body" TEXT NOT NULL, "reported" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "Rating" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "movieId" TEXT, "seriesId" TEXT, "value" INTEGER NOT NULL, "review" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "Notification" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP', "title" TEXT NOT NULL, "body" TEXT NOT NULL, "href" TEXT, "readAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "Recommendation" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "movieId" TEXT NOT NULL, "score" DOUBLE PRECISION NOT NULL, "reason" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "AnalyticsEvent" ("id" TEXT PRIMARY KEY, "userId" TEXT, "name" TEXT NOT NULL, "path" TEXT, "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "Setting" ("key" TEXT PRIMARY KEY, "value" JSONB NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "Advertisement" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "imageUrl" TEXT, "videoUrl" TEXT, "href" TEXT, "movieId" TEXT, "active" BOOLEAN NOT NULL DEFAULT true, "startsAt" TIMESTAMP(3), "endsAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);

ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Movie" ADD CONSTRAINT "Movie_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Series" ADD CONSTRAINT "Series_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Season" ADD CONSTRAINT "Season_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LiveChannel" ADD CONSTRAINT "LiveChannel_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LiveChannel" ADD CONSTRAINT "LiveChannel_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_liveChannelId_fkey" FOREIGN KEY ("liveChannelId") REFERENCES "LiveChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Movie_published_featured_idx" ON "Movie"("published", "featured");
CREATE INDEX "Movie_releaseDate_idx" ON "Movie"("releaseDate");
CREATE INDEX "Movie_averageRating_idx" ON "Movie"("averageRating");
CREATE INDEX "Schedule_liveChannelId_startsAt_idx" ON "Schedule"("liveChannelId", "startsAt");
CREATE INDEX "History_userId_updatedAt_idx" ON "History"("userId", "updatedAt");
CREATE INDEX "AnalyticsEvent_name_createdAt_idx" ON "AnalyticsEvent"("name", "createdAt");

ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_movieId_key" UNIQUE ("userId", "movieId");
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_seriesId_key" UNIQUE ("userId", "seriesId");
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_episodeId_key" UNIQUE ("userId", "episodeId");
ALTER TABLE "History" ADD CONSTRAINT "History_userId_movieId_key" UNIQUE ("userId", "movieId");
ALTER TABLE "History" ADD CONSTRAINT "History_userId_episodeId_key" UNIQUE ("userId", "episodeId");
ALTER TABLE "WatchLater" ADD CONSTRAINT "WatchLater_userId_movieId_key" UNIQUE ("userId", "movieId");
ALTER TABLE "WatchLater" ADD CONSTRAINT "WatchLater_userId_seriesId_key" UNIQUE ("userId", "seriesId");
ALTER TABLE "WatchLater" ADD CONSTRAINT "WatchLater_userId_episodeId_key" UNIQUE ("userId", "episodeId");
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_userId_movieId_key" UNIQUE ("userId", "movieId");
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_userId_seriesId_key" UNIQUE ("userId", "seriesId");
