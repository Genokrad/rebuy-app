-- Add selectedOptions column to VariantDetails to match Prisma schema
-- SQLite stores JSON as TEXT under the hood, Prisma will map this to Json?

ALTER TABLE "VariantDetails"
ADD COLUMN "selectedOptions" TEXT;


