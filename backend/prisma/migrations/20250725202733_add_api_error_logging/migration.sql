-- CreateTable
CREATE TABLE "ApiError" (
    "id" SERIAL NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "stackTrace" TEXT,
    "userId" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "requestBody" TEXT,
    "statusCode" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiError_endpoint_idx" ON "ApiError"("endpoint");

-- CreateIndex
CREATE INDEX "ApiError_statusCode_idx" ON "ApiError"("statusCode");

-- CreateIndex
CREATE INDEX "ApiError_createdAt_idx" ON "ApiError"("createdAt");

-- CreateIndex
CREATE INDEX "ApiError_userId_idx" ON "ApiError"("userId");
