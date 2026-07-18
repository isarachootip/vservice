import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  try {
    const keys = [
      "example_image_slot1", "example_image_slot2", "example_image_slot3", "example_image_slot4",
      "example_desc_slot1", "example_desc_slot2", "example_desc_slot3", "example_desc_slot4"
    ];

    const configs = await prisma.system_config.findMany({
      where: { config_key: { in: keys } },
    });

    const result = {
      slot1: { url: "", desc: "" },
      slot2: { url: "", desc: "" },
      slot3: { url: "", desc: "" },
      slot4: { url: "", desc: "" },
    };

    for (const c of configs) {
      if (c.config_key === "example_image_slot1") result.slot1.url = c.config_value;
      if (c.config_key === "example_desc_slot1") result.slot1.desc = c.config_value;
      if (c.config_key === "example_image_slot2") result.slot2.url = c.config_value;
      if (c.config_key === "example_desc_slot2") result.slot2.desc = c.config_value;
      if (c.config_key === "example_image_slot3") result.slot3.url = c.config_value;
      if (c.config_key === "example_desc_slot3") result.slot3.desc = c.config_value;
      if (c.config_key === "example_image_slot4") result.slot4.url = c.config_value;
      if (c.config_key === "example_desc_slot4") result.slot4.desc = c.config_value;
    }

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    console.error("GET example-images error:", error);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const slot = String(formData.get("slot") ?? "").trim();
    const action = String(formData.get("action") ?? "").trim();
    const desc = String(formData.get("desc") ?? "");

    if (!slot || !["slot1", "slot2", "slot3", "slot4"].includes(slot)) {
      return NextResponse.json({ ok: false, message: "Invalid slot parameter" }, { status: 400 });
    }

    const imgKey = `example_image_${slot}`;
    const descKey = `example_desc_${slot}`;

    // Handle delete action
    if (action === "delete") {
      // Find old image path to delete file from disk
      const existing = await prisma.system_config.findUnique({
        where: { config_key: imgKey }
      });

      if (existing && existing.config_value) {
        try {
          const oldFilePath = path.join(process.cwd(), "public", existing.config_value);
          await fs.unlink(oldFilePath);
        } catch (err) {
          console.warn("Could not delete old file:", err);
        }
      }

      // Upsert database config values to empty string
      await prisma.system_config.upsert({
        where: { config_key: imgKey },
        update: { config_value: "", updated_at: new Date() },
        create: { config_key: imgKey, config_value: "" }
      });

      await prisma.system_config.upsert({
        where: { config_key: descKey },
        update: { config_value: "", updated_at: new Date() },
        create: { config_key: descKey, config_value: "" }
      });

      return NextResponse.json({ ok: true });
    }

    // Handle save / upload action
    const file = formData.get("file");
    let imageUrl = "";

    // If file is provided, upload it
    if (file && file instanceof File) {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "config");
      await fs.mkdir(uploadDir, { recursive: true });

      // Get file extension
      const originalName = file.name;
      let extension = path.extname(originalName);
      if (!extension) {
        if (file.type === "image/png") extension = ".png";
        else if (file.type === "image/jpeg" || file.type === "image/jpg") extension = ".jpg";
        else if (file.type === "image/gif") extension = ".gif";
        else extension = ".png";
      }

      const fileName = `example_${slot}_${Date.now()}${extension}`;
      const absPath = path.join(uploadDir, fileName);

      const bytes = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(absPath, bytes);

      imageUrl = `/uploads/config/${fileName}`;

      // Delete the old file if it exists
      const existing = await prisma.system_config.findUnique({
        where: { config_key: imgKey }
      });

      if (existing && existing.config_value) {
        try {
          const oldFilePath = path.join(process.cwd(), "public", existing.config_value);
          await fs.unlink(oldFilePath);
        } catch (err) {
          console.warn("Could not delete old file:", err);
        }
      }

      // Update image key in database
      await prisma.system_config.upsert({
        where: { config_key: imgKey },
        update: { config_value: imageUrl, updated_at: new Date() },
        create: { config_key: imgKey, config_value: imageUrl }
      });
    }

    // Update description in database
    await prisma.system_config.upsert({
      where: { config_key: descKey },
      update: { config_value: desc, updated_at: new Date() },
      create: { config_key: descKey, config_value: desc }
    });

    return NextResponse.json({ ok: true, imageUrl });
  } catch (error) {
    console.error("POST example-images error:", error);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
