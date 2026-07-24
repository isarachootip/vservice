const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Find distinct brands similar to 'IMARFLEX' or 'IMALFLEX'
  const brands = await prisma.$queryRaw`
    SELECT DISTINCT TRIM(brand) as brand FROM public.commodity WHERE brand ILIKE '%IMARFLEX%' OR brand ILIKE '%IMALFLEX%'
  `;
  console.log("=== Brands ===");
  console.log(brands);

  // Find classes for brand 'IMARFLEX'
  const classes = await prisma.$queryRaw`
    SELECT DISTINCT TRIM(class_name) as class_name FROM public.commodity WHERE TRIM(brand) = 'IMARFLEX'
  `;
  console.log("\n=== Classes for IMARFLEX ===");
  console.log(classes);

  // Find commodities for brand 'IMARFLEX' and class_name 'Industrial Fan'
  const commodities = await prisma.$queryRaw`
    SELECT sku, sbc, brand, class_name, sku_name, sku_status_name
    FROM public.commodity
    WHERE TRIM(brand) = 'IMARFLEX' AND TRIM(class_name) = 'Industrial Fan'
  `;
  console.log("\n=== Commodities for IMARFLEX & Industrial Fan ===");
  console.log(commodities);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
