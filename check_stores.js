const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const stores = await prisma.store.findMany({
    take: 10
  });
  console.log("=== Stores ===");
  stores.forEach(s => {
    console.log(`Store Code: ${s.store_code}, Name: ${s.store_name_th}, Location: ${s.store_location}`);
  });

  const locations = await prisma.location.findMany({
    take: 10
  });
  console.log("=== Locations ===");
  locations.forEach(l => {
    console.log(`Location ID: ${l.id}, Name: ${l.name}, Code: ${l.code}`);
  });
  
  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
