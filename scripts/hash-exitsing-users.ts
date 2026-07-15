import { prisma } from "@/lib/database";
import bcrypt from "bcryptjs";

async function main() {
  const users = await prisma.users.findMany({
    select: { user_id: true, user_name: true, user_password: true },
  });

  let updated = 0;
  for (const u of users) {
    const pw = u.user_password ?? "";
    if (!pw || pw.startsWith("$2")) continue;

    const hashed = await bcrypt.hash(pw, 10); 
    await prisma.users.update({
      where: { user_id: u.user_id },
      data: { user_password: hashed },
    });
    updated++;
    console.log(`✅ hashed: ${u.user_name}`);
  }

  console.log(`\n Summary: updated ${updated} user(s).`);
}

main()
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
