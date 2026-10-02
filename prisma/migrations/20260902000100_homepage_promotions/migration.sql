-- Add an admin-controlled homepage promotion row without changing existing content records.
CREATE TYPE "PromotionContentType" AS ENUM ('MOVIE', 'SERIES');

CREATE TABLE "HomepagePromotion" (
    "id" TEXT NOT NULL,
    "contentType" "PromotionContentType" NOT NULL,
    "movieId" TEXT,
    "seriesId" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepagePromotion_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "HomepagePromotion_content_reference_check" CHECK (
        ("contentType" = 'MOVIE' AND "movieId" IS NOT NULL AND "seriesId" IS NULL)
        OR
        ("contentType" = 'SERIES' AND "seriesId" IS NOT NULL AND "movieId" IS NULL)
    )
);

CREATE UNIQUE INDEX "HomepagePromotion_movieId_key" ON "HomepagePromotion"("movieId");
CREATE UNIQUE INDEX "HomepagePromotion_seriesId_key" ON "HomepagePromotion"("seriesId");
CREATE INDEX "HomepagePromotion_active_sortOrder_idx" ON "HomepagePromotion"("active", "sortOrder");
CREATE INDEX "HomepagePromotion_contentType_idx" ON "HomepagePromotion"("contentType");

ALTER TABLE "HomepagePromotion"
ADD CONSTRAINT "HomepagePromotion_movieId_fkey"
FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HomepagePromotion"
ADD CONSTRAINT "HomepagePromotion_seriesId_fkey"
FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;