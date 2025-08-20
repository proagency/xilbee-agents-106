-- CreateEnum
CREATE TYPE "public"."ClientStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."AgentStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('INITIATED', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripeCustomerId" TEXT,
    "stripeDefaultPaymentMethod" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "baseMonthlyFee" DECIMAL(18,6),
    "monthlyCreditLimit" DECIMAL(18,6),
    "overageRatePerCredit" DECIMAL(18,6),
    "usageUnitLabel" TEXT,
    "billingAnchorDay" INTEGER,
    "billingTimezone" TEXT,
    "nextChargeDate" TIMESTAMP(3),
    "billingContactName" TEXT,
    "billingContactEmail" TEXT,
    "billingAddressLine1" TEXT,
    "billingAddressCity" TEXT,
    "billingAddressState" TEXT,
    "billingAddressPostalCode" TEXT,
    "billingAddressCountry" TEXT,
    "taxId" TEXT,
    "invoiceExtraEmails" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Agent" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "externalAgentId" TEXT,
    "label" TEXT,
    "status" "public"."AgentStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UsageLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "agentId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "connectionDurationSec" INTEGER,
    "callCreditsUsed" DECIMAL(18,6),
    "llmCreditsUsed" DECIMAL(18,6),
    "llmRateUsdPerMin" DECIMAL(18,6),
    "llmTotalCostUsd" DECIMAL(18,6),
    "sessionId" TEXT NOT NULL,
    "contact" TEXT,
    "notes" TEXT,
    "totalCreditsConsumed" DECIMAL(18,6),
    "raw" JSONB,

    CONSTRAINT "UsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MonthlySummary" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "totalUsage" DECIMAL(18,6),
    "limit" DECIMAL(18,6),
    "overage" DECIMAL(18,6),
    "chargeAmount" DECIMAL(18,6),
    "subscriptionDate" TIMESTAMP(3),
    "lastChargeDate" TIMESTAMP(3),
    "lastPaymentStatus" TEXT,
    "nextChargeDate" TIMESTAMP(3),
    "raw" JSONB,

    CONSTRAINT "MonthlySummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethodId" TEXT NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'INITIATED',
    "externalChargeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "public"."AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_name_key" ON "public"."Client"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Client_stripeCustomerId_key" ON "public"."Client"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Agent_clientId_idx" ON "public"."Agent"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "UsageLog_sessionId_key" ON "public"."UsageLog"("sessionId");

-- CreateIndex
CREATE INDEX "UsageLog_timestamp_idx" ON "public"."UsageLog"("timestamp");

-- CreateIndex
CREATE INDEX "UsageLog_clientId_idx" ON "public"."UsageLog"("clientId");

-- CreateIndex
CREATE INDEX "MonthlySummary_clientId_idx" ON "public"."MonthlySummary"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlySummary_clientId_year_month_key" ON "public"."MonthlySummary"("clientId", "year", "month");

-- CreateIndex
CREATE INDEX "Payment_clientId_idx" ON "public"."Payment"("clientId");

-- AddForeignKey
ALTER TABLE "public"."Agent" ADD CONSTRAINT "Agent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UsageLog" ADD CONSTRAINT "UsageLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UsageLog" ADD CONSTRAINT "UsageLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MonthlySummary" ADD CONSTRAINT "MonthlySummary_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
