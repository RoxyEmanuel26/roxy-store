-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "description" TEXT,
ADD COLUMN     "icon" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "originalPrice" DOUBLE PRECISION,
ADD COLUMN     "shopeeRating" DOUBLE PRECISION,
ADD COLUMN     "shopeeSold" INTEGER,
ALTER COLUMN "shopeeUrl" SET DEFAULT '',
ALTER COLUMN "tokopediaUrl" SET DEFAULT '';

-- CreateIndex
CREATE INDEX "Product_slug_idx" ON "Product"("slug");
