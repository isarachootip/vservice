const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.system_config.findMany();
  console.log("=== Current system_config rows ===");
  console.log(configs);
}

main().finally(() => prisma.$disconnect());
