-- Add isOldContent column to Episode table
ALTER TABLE "Episode" ADD COLUMN "isOldContent" BOOLEAN NOT NULL DEFAULT false;
