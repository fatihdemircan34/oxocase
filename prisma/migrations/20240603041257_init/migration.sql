/*
  Warnings:

  - You are about to drop the `ApkDistribution` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "ApkDistribution";

-- CreateTable
CREATE TABLE "apk_distribution" (
    "id" SERIAL NOT NULL,
    "distribution_number" TEXT NOT NULL,
    "mongodb_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apk_distribution_pkey" PRIMARY KEY ("id")
);
