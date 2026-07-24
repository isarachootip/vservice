import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const flow = (searchParams.get("flow") || "create_repair").trim();

    const flowRegex = /^[a-zA-Z0-9_]+$/;
    if (!flowRegex.test(flow)) {
      return NextResponse.json({ ok: false, message: "Invalid flow parameter" }, { status: 400 });
    }

    const keys = [
      `${flow}_image_slot1`, `${flow}_image_slot2`, `${flow}_image_slot3`, `${flow}_image_slot4`,
      `${flow}_desc_slot1`, `${flow}_desc_slot2`, `${flow}_desc_slot3`, `${flow}_desc_slot4`
    ];

    // If flow is create_repair, load legacy keys for fallback
    if (flow === "create_repair") {
      keys.push(
        "example_image_slot1", "example_image_slot2", "example_image_slot3", "example_image_slot4",
        "example_desc_slot1", "example_desc_slot2", "example_desc_slot3", "example_desc_slot4"
      );
    }

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
      if (c.config_key === `${flow}_image_slot1`) result.slot1.url = c.config_value;
      if (c.config_key === `${flow}_desc_slot1`) result.slot1.desc = c.config_value;
      if (c.config_key === `${flow}_image_slot2`) result.slot2.url = c.config_value;
      if (c.config_key === `${flow}_desc_slot2`) result.slot2.desc = c.config_value;
      if (c.config_key === `${flow}_image_slot3`) result.slot3.url = c.config_value;
      if (c.config_key === `${flow}_desc_slot3`) result.slot3.desc = c.config_value;
      if (c.config_key === `${flow}_image_slot4`) result.slot4.url = c.config_value;
      if (c.config_key === `${flow}_desc_slot4`) result.slot4.desc = c.config_value;
    }

    // Fallback to legacy keys if flow is create_repair and specific keys are empty
    if (flow === "create_repair") {
      const getVal = (key: string) => configs.find(c => c.config_key === key)?.config_value || "";
      if (!result.slot1.url) result.slot1.url = getVal("example_image_slot1");
      if (!result.slot1.desc) result.slot1.desc = getVal("example_desc_slot1");
      if (!result.slot2.url) result.slot2.url = getVal("example_image_slot2");
      if (!result.slot2.desc) result.slot2.desc = getVal("example_desc_slot2");
      if (!result.slot3.url) result.slot3.url = getVal("example_image_slot3");
      if (!result.slot3.desc) result.slot3.desc = getVal("example_desc_slot3");
      if (!result.slot4.url) result.slot4.url = getVal("example_image_slot4");
      if (!result.slot4.desc) result.slot4.desc = getVal("example_desc_slot4");
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
    const flow = String(formData.get("flow") ?? "create_repair").trim();

    if (!slot || !["slot1", "slot2", "slot3", "slot4"].includes(slot)) {
      return NextResponse.json({ ok: false, message: "Invalid slot parameter" }, { status: 400 });
    }

    const flowRegex = /^[a-zA-Z0-9_]+$/;
    if (!flow || !flowRegex.test(flow)) {
      return NextResponse.json({ ok: false, message: "Invalid flow parameter" }, { status: 400 });
    }

    const imgKey = `${flow}_image_${slot}`;
    const descKey = `${flow}_desc_${slot}`;

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

      // Legacy fallback delete
      if (flow === "create_repair") {
        const legacyKey = `example_image_${slot}`;
        const legacyExist = await prisma.system_config.findUnique({
          where: { config_key: legacyKey }
        });
        if (legacyExist && legacyExist.config_value) {
          try {
            const oldFilePath = path.join(process.cwd(), "public", legacyExist.config_value);
            await fs.unlink(oldFilePath);
          } catch {}
          await prisma.system_config.upsert({
            where: { config_key: legacyKey },
            update: { config_value: "", updated_at: new Date() },
            create: { config_key: legacyKey, config_value: "" }
          });
        }
      }

      // Update database config values to empty string for flow-specific key
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

      const originalName = file.name;
      let extension = path.extname(originalName);
      if (!extension) {
        if (file.type === "image/png") extension = ".png";
        else if (file.type === "image/jpeg" || file.type === "image/jpg") extension = ".jpg";
        else if (file.type === "image/gif") extension = ".gif";
        else extension = ".png";
      }

      const fileName = `example_${flow}_${slot}_${Date.now()}${extension}`;
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
