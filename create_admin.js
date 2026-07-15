const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("1234", 10);
  
  // Check if admin user already exists
  const existing = await prisma.users.findUnique({
    where: { user_name: "test_admin" }
  });

  if (existing) {
    console.log("Admin user 'test_admin' already exists.");
  } else {
    await prisma.users.create({
      data: {
        user_name: "test_admin",
        user_full_name: "System Administrator",
        user_email: "admin@company.com",
        user_password: hashedPassword,
        roles_id: 4, // ADMIN role
        is_active: 1,
        store_code: "S001",
        created_user: "system",
        updated_user: "system"
      }
    });
    console.log("Admin user 'test_admin' created successfully!");
  }
  
  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Failed to create admin:", err);
  process.exit(1);
});
