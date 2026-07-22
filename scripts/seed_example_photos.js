const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding example photos...");

  // Define directories
  const uploadDir = path.join(__dirname, "..", "public", "uploads", "config");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Created directory:", uploadDir);
  }

  // Source paths from the brain directory
  const brainDir = "C:\\Users\\isara\\.gemini\\antigravity\\brain\\97119789-4a48-43b9-b593-487c652b0368";
  const sourceImages = {
    slot1: path.join(brainDir, "camera_front_view_1784474074659.png"),
    slot2: path.join(brainDir, "camera_side_view_1784474086827.png"),
    slot3: path.join(brainDir, "camera_top_view_1784474099994.png"),
    slot4: path.join(brainDir, "camera_serial_view_1784474113577.png")
  };

  // Destination names exactly as shown in screenshot
  const destNames = {
    slot1: "Gemini_Generated_Image_cx140gzo84rgoz84.jpg",
    slot2: "Gemini_Generated_Image_rmdb2pvmob2pvmdb (1).jpg",
    slot3: "Gemini_Generated_Image_annn1tannn1tannn.jpg",
    slot4: "Gemini_Generated_Image_xv7gt9vv1gt9vv7g.jpg"
  };

  // Copy images
  for (const slot of ["slot1", "slot2", "slot3", "slot4"]) {
    const src = sourceImages[slot];
    const dest = path.join(uploadDir, destNames[slot]);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`Copied ${slot} image to ${dest}`);
    } else {
      console.error(`Source file not found: ${src}`);
    }
  }

  // Define the configurations to seed
  const configs = [
    // Slot 1
    {
      config_key: "create_repair_image_slot1",
      config_value: `/uploads/config/${destNames.slot1}`
    },
    {
      config_key: "create_repair_desc_slot1",
      config_value: "แนะนำให้ถ่ายรูปตรงจากด้านบนของเครื่องหรือ เพื่อตรวจสอบสภาพภายนอก"
    },
    // Slot 2
    {
      config_key: "create_repair_image_slot2",
      config_value: `/uploads/config/${destNames.slot2}`
    },
    {
      config_key: "create_repair_desc_slot2",
      config_value: "แนะนำให้ถ่ายด้านข้างของเครื่องเพื่อใช้เป็นส่วนใช้แสดงพอร์ตการเชื่อมต่อ"
    },
    // Slot 3
    {
      config_key: "create_repair_image_slot3",
      config_value: `/uploads/config/${destNames.slot3}`
    },
    {
      config_key: "create_repair_desc_slot3",
      config_value: "แนะนำให้ถ่ายชิ้นส่วนอะไหล่หรือด้านอื่นๆ เพิ่มเติม"
    },
    // Slot 4
    {
      config_key: "create_repair_image_slot4",
      config_value: `/uploads/config/${destNames.slot4}`
    },
    {
      config_key: "create_repair_desc_slot4",
      config_value: "แนะนำให้ถ่ายป้ายสติ๊กเกอร์ Serial Number ซูมให้เห็นตัวอักษรและบาร์โค้ดชัดเจน"
    }
  ];

  // Legacy fallback configs for create_repair flow as well, to be extra safe
  const legacyConfigs = [
    { config_key: "example_image_slot1", config_value: `/uploads/config/${destNames.slot1}` },
    { config_key: "example_desc_slot1", config_value: "แนะนำให้ถ่ายรูปตรงจากด้านบนของเครื่องหรือ เพื่อตรวจสอบสภาพภายนอก" },
    { config_key: "example_image_slot2", config_value: `/uploads/config/${destNames.slot2}` },
    { config_key: "example_desc_slot2", config_value: "แนะนำให้ถ่ายด้านข้างของเครื่องเพื่อใช้เป็นส่วนใช้แสดงพอร์ตการเชื่อมต่อ" },
    { config_key: "example_image_slot3", config_value: `/uploads/config/${destNames.slot3}` },
    { config_key: "example_desc_slot3", config_value: "แนะนำให้ถ่ายชิ้นส่วนอะไหล่หรือด้านอื่นๆ เพิ่มเติม" },
    { config_key: "example_image_slot4", config_value: `/uploads/config/${destNames.slot4}` },
    { config_key: "example_desc_slot4", config_value: "แนะนำให้ถ่ายป้ายสติ๊กเกอร์ Serial Number ซูมให้เห็นตัวอักษรและบาร์โค้ดชัดเจน" }
  ];

  // Seed flow-specific configs
  for (const c of configs) {
    await prisma.system_config.upsert({
      where: { config_key: c.config_key },
      update: { config_value: c.config_value, updated_at: new Date() },
      create: { config_key: c.config_key, config_value: c.config_value }
    });
  }

  // Seed legacy configs
  for (const c of legacyConfigs) {
    await prisma.system_config.upsert({
      where: { config_key: c.config_key },
      update: { config_value: c.config_value, updated_at: new Date() },
      create: { config_key: c.config_key, config_value: c.config_value }
    });
  }

  console.log("Example photos config seeding complete!");
}

main()
  .catch(e => {
    console.error("Error seeding example photos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
