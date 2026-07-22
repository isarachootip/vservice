import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const includeAll = searchParams.get("all") === "true";

    let locations = await prisma.location.findMany({
      orderBy: { id: "asc" },
    });

    if (!includeAll) {
      locations = locations.filter((l) => {
        const nameLower = l.name.toLowerCase();
        const shortLower = (l.short_name || "").toLowerCase();
        const buUpper = (l.bu || "").toUpperCase();

        if (buUpper === "TW" || buUpper === "HBY" || buUpper === "HO" || buUpper === "HEAD OFFICE") {
          return true;
        }

        if (
          nameLower.includes("auto1") ||
          nameLower.includes("auto 1") ||
          nameLower.includes("gowow") ||
          nameLower.includes("go! wow") ||
          nameLower.includes("go wow") ||
          nameLower.includes("joy") ||
          shortLower.includes("auto1") ||
          shortLower.includes("gowow")
        ) {
          return false;
        }

        return true;
      });
    }

    return NextResponse.json({ ok: true, locations });
  } catch (error) {
    console.error("GET /api/maintain/locations error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลสาขา" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { locations } = body; // Array of { id, name, shortName, code, status }

    if (!locations) {
      // Single location POST
      const { id, name, short_name, code, status, bu } = body;
      if (!id || !name) {
        return NextResponse.json({ ok: false, message: "กรุณาระบุรหัสและชื่อสาขา" }, { status: 400 });
      }
      const existing = await prisma.location.findUnique({
        where: { id: id.trim() },
      });
      if (existing) {
        return NextResponse.json({ ok: false, message: "มีรหัสสาขานี้อยู่ในระบบแล้ว" }, { status: 400 });
      }
      await prisma.location.create({
        data: {
          id: id.trim(),
          name: name.trim(),
          short_name: short_name?.trim() || null,
          code: code?.trim() || null,
          status: status?.trim() || "active",
          bu: bu?.trim() || null,
        },
      });
      return NextResponse.json({ ok: true, message: "เพิ่มข้อมูลสาขาสำเร็จ" });
    }

    if (!Array.isArray(locations)) {
      return NextResponse.json(
        { ok: false, message: "รูปแบบข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (locations.length === 0) {
      return NextResponse.json(
        { ok: false, message: "ไม่พบข้อมูลสาขาในไฟล์ที่อัปโหลด" },
        { status: 400 }
      );
    }

    // Upsert locations
    const upserts = locations.map((loc) => {
      // Handle various cases of location properties
      const rawId = loc.id || loc.code || loc.name;
      if (!rawId || !loc.name) {
        throw new Error("ข้อมูลสาขาจำเป็นต้องมี ID หรือ Code และ Name");
      }
      
      const id = String(rawId).trim();
      const name = String(loc.name).trim();
      const short_name = loc.shortName || loc.short_name ? String(loc.shortName || loc.short_name).trim() : null;
      const code = loc.code ? String(loc.code).trim() : null;
      const status = loc.status ? String(loc.status).trim() : "active";
      const bu = loc.bu ? String(loc.bu).trim() : null;

      return prisma.location.upsert({
        where: { id },
        update: {
          name,
          short_name,
          code,
          status,
          bu,
          updated_at: new Date(),
        },
        create: {
          id,
          name,
          short_name,
          code,
          status,
          bu,
        },
      });
    });

    await prisma.$transaction(upserts);

    return NextResponse.json({
      ok: true,
      message: `นำเข้าข้อมูลสาขาสำเร็จ ${locations.length} รายการ`,
    });
  } catch (error: any) {
    console.error("POST /api/maintain/locations error:", error);
    return NextResponse.json(
      { ok: false, message: error.message || "เกิดข้อผิดพลาดในการนำเข้าข้อมูลสาขา" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, short_name, code, status, bu } = body;

    if (!id || !name) {
      return NextResponse.json({ ok: false, message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const existing = await prisma.location.findUnique({
      where: { id: id.trim() },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, message: "ไม่พบข้อมูลสาขา" }, { status: 404 });
    }

    await prisma.location.update({
      where: { id: id.trim() },
      data: {
        name: name.trim(),
        short_name: short_name?.trim() || null,
        code: code?.trim() || null,
        status: status?.trim() || "active",
        bu: bu?.trim() || null,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ ok: true, message: "อัปเดตข้อมูลสาขาสำเร็จ" });
  } catch (error) {
    console.error("PUT /api/maintain/locations error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลสาขา" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all");

    if (all === "true" || id === "all") {
      await prisma.users.updateMany({
        where: { location_id: { not: null } },
        data: { location_id: null },
      });
      await prisma.repair_request.updateMany({
        where: { location_id: { not: null } },
        data: { location_id: null },
      });
      await prisma.chat_room.deleteMany({
        where: { location_id: { not: null } },
      });
      await prisma.location.deleteMany({});
      await prisma.store.deleteMany({});
      return NextResponse.json({ ok: true, message: "ลบข้อมูลสาขาทั้งหมดเรียบร้อยแล้ว" });
    }

    if (!id) {
      return NextResponse.json({ ok: false, message: "ไม่พบ ID ที่ต้องการลบ" }, { status: 400 });
    }

    await prisma.location.delete({
      where: { id: id.trim() },
    });

    return NextResponse.json({ ok: true, message: "ลบข้อมูลสาขาสำเร็จ" });
  } catch (error) {
    console.error("DELETE /api/maintain/locations error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการลบข้อมูลสาขา" },
      { status: 500 }
    );
  }
}
