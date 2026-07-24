const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const vendors = await prisma.vendor_info.findMany({
    take: 20
  });
  console.log("=== Vendor Info in DB ===");
  console.log(vendors);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
