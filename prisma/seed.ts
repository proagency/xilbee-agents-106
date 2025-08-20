import { PrismaClient, Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

function daysFromNow(min: number, max: number) {
  const now = new Date()
  const add = Math.floor(Math.random() * (max - min + 1)) + min
  return new Date(now.getTime() + add * 24 * 60 * 60 * 1000)
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@xilbee.com"
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456"

  const passwordHash = await bcrypt.hash(adminPassword, 10)
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, passwordHash },
  })

  const clientsData = [
    {
      name: "Aurora Labs",
      stripeCustomerId: "cus_AURORA123",
      stripeDefaultPaymentMethod: "pm_AURORAcard",
      currency: "USD",
      baseMonthlyFee: new Prisma.Decimal("199.00"),
      monthlyCreditLimit: new Prisma.Decimal("1000"),
      overageRatePerCredit: new Prisma.Decimal("0.20"),
      usageUnitLabel: "credit",
      billingAnchorDay: 8,
      billingTimezone: "Asia/Manila",
      billingContactName: "Ava Reynolds",
      billingContactEmail: "billing@auroralabs.example",
      nextChargeDate: daysFromNow(5, 8),
    },
    {
      name: "Harbor & Co.",
      stripeCustomerId: "cus_HARBOR456",
      stripeDefaultPaymentMethod: "pm_HARBORcard",
      currency: "USD",
      baseMonthlyFee: new Prisma.Decimal("299.00"),
      monthlyCreditLimit: new Prisma.Decimal("2000"),
      overageRatePerCredit: new Prisma.Decimal("0.18"),
      usageUnitLabel: "credit",
      billingAnchorDay: 12,
      billingTimezone: "Asia/Manila",
      billingContactName: "Mila Santos",
      billingContactEmail: "ap@harborco.example",
      nextChargeDate: daysFromNow(5, 8),
    },
  ]

  for (const c of clientsData) {
    const client = await prisma.client.upsert({
      where: { name: c.name },
      update: c,
      create: c,
    })

    // 2 demo agents per client
    const agents = [
      { label: `${client.name} Agent A`, externalAgentId: `ext_${client.name.replace(/\W+/g,"").toLowerCase()}_a` },
      { label: `${client.name} Agent B`, externalAgentId: `ext_${client.name.replace(/\W+/g,"").toLowerCase()}_b` },
    ]
    for (const a of agents) {
      await prisma.agent.create({
        data: { clientId: client.id, label: a.label, externalAgentId: a.externalAgentId },
      })
    }
  }

  console.log("Seed completed.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
