import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { id: "asc" },
    });
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

      return prisma.location.upsert({
        where: { id },
        update: {
          name,
          short_name,
          code,
          status,
          updated_at: new Date(),
        },
        create: {
          id,
          name,
          short_name,
          code,
          status,
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
