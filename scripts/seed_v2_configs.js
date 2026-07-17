const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Version 2.0 configurations...");

  // 1. Seed Service Tiers
  const tiers = [
    { tier: "NORMAL", sla_multiplier: 1.00, surcharge_type: "FLAT", surcharge_value: 0.00 },
    { tier: "EXPRESS", sla_multiplier: 0.50, surcharge_type: "PERCENT", surcharge_value: 50.00 },
    { tier: "VIP", sla_multiplier: 0.50, surcharge_type: "FLAT", surcharge_value: 0.00 }
  ];

  for (const t of tiers) {
    await prisma.service_tier_config.upsert({
      where: { tier: t.tier },
      update: t,
      create: t
    });
  }
  console.log("Seeded service tiers.");

  // 2. Seed Diagnostic Fees
  const fees = [
    { product_type: "เครื่องใช้ไฟฟ้าขนาดเล็ก (Small Appliance)", fee_amount: 100.00, waive_in_warranty: true },
    { product_type: "Power Tools / Fanlamp", fee_amount: 150.00, waive_in_warranty: true },
    { product_type: "TV / Microwave / Oven", fee_amount: 200.00, waive_in_warranty: true },
    { product_type: "เครื่องปรับอากาศทุกประเภท", fee_amount: 300.00, waive_in_warranty: true },
    { product_type: "ประตู / วงกบ", fee_amount: 500.00, waive_in_warranty: true },
    { product_type: "สินค้า Premium / General", fee_amount: 0.00, waive_in_warranty: true }
  ];

  for (const f of fees) {
    await prisma.diagnostic_fee_config.upsert({
      where: { product_type: f.product_type },
      update: f,
      create: f
    });
  }
  console.log("Seeded diagnostic fees.");

  // 3. Seed Margins
  const margins = [
    { product_type: "เครื่องใช้ไฟฟ้าขนาดเล็ก (Small Appliance)", margin_percent: 30.00, margin_floor: 15.00 },
    { product_type: "Power Tools / Fanlamp", margin_percent: 30.00, margin_floor: 15.00 },
    { product_type: "TV / Microwave / Oven", margin_percent: 30.00, margin_floor: 15.00 },
    { product_type: "เครื่องปรับอากาศทุกประเภท", margin_percent: 30.00, margin_floor: 15.00 },
    { product_type: "ประตู / วงกบ", margin_percent: 30.00, margin_floor: 15.00 },
    { product_type: "สินค้า Premium / General", margin_percent: 30.00, margin_floor: 15.00 }
  ];

  for (const m of margins) {
    await prisma.margin_config.upsert({
      where: { product_type: m.product_type },
      update: m,
      create: m
    });
  }
  console.log("Seeded default profit margins.");

  console.log("Version 2.0 configuration seed complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
