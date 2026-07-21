CREATE TABLE "MoviePart" (
    "id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "downloadUrl" TEXT,
    "runtimeMinutes" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoviePart_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MoviePart_movieId_number_key" ON "MoviePart"("movieId", "number");

ALTER TABLE "MoviePart" ADD CONSTRAINT "MoviePart_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
