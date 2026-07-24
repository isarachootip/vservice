const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Disconnecting users from locations...");
  await prisma.users.updateMany({
    where: { location_id: { not: null } },
    data: { location_id: null },
  });

  console.log("Disconnecting repair_requests from locations...");
  await prisma.repair_request.updateMany({
    where: { location_id: { not: null } },
    data: { location_id: null },
  });

  console.log("Clearing chat rooms associated with locations...");
  await prisma.chat_room.deleteMany({
    where: { location_id: { not: null } },
  });

  console.log("Deleting all location records...");
  const locResult = await prisma.location.deleteMany({});
  console.log(`Deleted ${locResult.count} locations.`);

  console.log("Deleting all store records...");
  const storeResult = await prisma.store.deleteMany({});
  console.log(`Deleted ${storeResult.count} stores.`);

  await prisma.$disconnect();
  console.log("Clear operation completed successfully.");
}

main().catch(err => {
  console.error("Error clearing locations/stores:", err);
  process.exit(1);
});
