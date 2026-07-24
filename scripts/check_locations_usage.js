const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const locationCount = await prisma.location.count();
  const storeCount = await prisma.store.count();
  const usersWithLoc = await prisma.users.count({ where: { location_id: { not: null } } });
  const requestsWithLoc = await prisma.repair_request.count({ where: { location_id: { not: null } } });

  console.log("Location count:", locationCount);
  console.log("Store count:", storeCount);
  console.log("Users with location_id:", usersWithLoc);
  console.log("Requests with location_id:", requestsWithLoc);

  await prisma.$disconnect();
}

main().catch(console.error);
