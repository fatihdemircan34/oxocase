-- CreateTable
CREATE TABLE "ApkDistribution" (
    "id" SERIAL NOT NULL,
    "distributionNumber" TEXT NOT NULL,
    "mongodbId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApkDistribution_pkey" PRIMARY KEY ("id")
);
