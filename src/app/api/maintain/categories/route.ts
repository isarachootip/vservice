import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

export async function GET() {
  try {
    let list = await prisma.repair_category.findMany({
      orderBy: { name: "asc" },
    });

    if (list.length === 0) {
      // Auto-seed from commodity
      const rawClasses = await prisma.$queryRaw<{ class_name: string }[]>`
        SELECT DISTINCT TRIM(class_name) AS class_name 
        FROM public.commodity 
        WHERE class_name IS NOT NULL AND TRIM(class_name) <> '' AND TRIM(sku_status_name) = 'Active'
      `;
      const uniqueNames = Array.from(new Set(rawClasses.map(c => c.class_name.trim()))).filter(Boolean);
      if (uniqueNames.length > 0) {
        await prisma.repair_category.createMany({
          data: uniqueNames.map(name => ({
            name,
            created_user: "system",
            updated_user: "system",
          })),
          skipDuplicates: true,
        });
        list = await prisma.repair_category.findMany({
          orderBy: { name: "asc" },
        });
      }
    }

    return NextResponse.json({ ok: true, categories: list });
  } catch (error) {
    console.error("GET /api/maintain/categories error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, updatedUser } = body;

    if (!name) {
      return NextResponse.json({ ok: false, message: "กรุณาระบุชื่อหมวดหมู่" }, { status: 400 });
    }

    const existing = await prisma.repair_category.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json({ ok: false, message: "มีหมวดหมู่นี้อยู่ในระบบแล้ว" }, { status: 400 });
    }

    const newCategory = await prisma.repair_category.create({
      data: {
        name: name.trim(),
        created_user: updatedUser || "admin",
        updated_user: updatedUser || "admin",
      },
    });

    return NextResponse.json({ ok: true, message: "สร้างข้อมูลหมวดหมู่สำเร็จ", id: newCategory.id });
  } catch (error) {
    console.error("POST /api/maintain/categories error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูลหมวดหมู่" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, updatedUser } = body;

    if (!id || !name) {
      return NextResponse.json({ ok: false, message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const existing = await prisma.repair_category.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, message: "ไม่พบข้อมูลหมวดหมู่" }, { status: 404 });
    }

    const nameDuplicate = await prisma.repair_category.findFirst({
      where: {
        name: name.trim(),
        NOT: { id: Number(id) },
      },
    });

    if (nameDuplicate) {
      return NextResponse.json({ ok: false, message: "มีชื่อหมวดหมู่นี้อยู่ในระบบแล้ว" }, { status: 400 });
    }

    await prisma.repair_category.update({
      where: { id: Number(id) },
      data: {
        name: name.trim(),
        updated_user: updatedUser || "admin",
        updated_date: new Date(),
      },
    });

    return NextResponse.json({ ok: true, message: "อัปเดตข้อมูลหมวดหมู่สำเร็จ" });
  } catch (error) {
    console.error("PUT /api/maintain/categories error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลหมวดหมู่" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, message: "ไม่พบ ID ที่ต้องการลบ" }, { status: 400 });
    }

    await prisma.repair_category.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ ok: true, message: "ลบข้อมูลหมวดหมู่สำเร็จ" });
  } catch (error) {
    console.error("DELETE /api/maintain/categories error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการลบข้อมูลหมวดหมู่" },
      { status: 500 }
    );
  }
}
