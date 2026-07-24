const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const brand = "3 MITI";
  
  // Find distinct brands similar to '3 MITI'
  const brands = await prisma.$queryRaw`
    SELECT DISTINCT TRIM(brand) as brand FROM public.commodity WHERE brand ILIKE ${'%' + brand + '%'}
  `;
  console.log("=== Brands matching 3 MITI ===");
  console.log(brands);

  // Find distinct class_name for brand '3 MITI'
  const classes = await prisma.$queryRaw`
    SELECT DISTINCT TRIM(class_name) as class_name FROM public.commodity WHERE TRIM(brand) = ${brand}
  `;
  console.log("\n=== Classes for brand '3 MITI' ===");
  console.log(classes);

  // Find repair_category
  const categories = await prisma.repair_category.findMany();
  console.log("\n=== Repair Categories ===");
  console.log(categories.map(c => ({ name: c.name, name_th: c.name_th })));

  // Try to search class_name in repair_category
  const classNames = classes.map(c => c.class_name);
  const activeCategories = await prisma.repair_category.findMany({
    where: {
      name: { in: classNames }
    }
  });
  console.log("\n=== Matched Categories ===");
  console.log(activeCategories);

  // Find commodities for brand '3 MITI' and class_name 'Thai Style Kitchens' (or whatever matched)
  const commodities = await prisma.$queryRaw`
    SELECT sku, sbc, brand, class_name, sku_name, sku_status_name
    FROM public.commodity
    WHERE TRIM(brand) = ${brand}
  `;
  console.log("\n=== Commodities for 3 MITI ===");
  console.log(commodities);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
