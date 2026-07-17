import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

export async function GET() {
  try {
    // 1. Fetch unique active classes from commodity
    const rawClasses = await prisma.$queryRaw<{ class_name: string }[]>`
      SELECT DISTINCT TRIM(class_name) AS class_name 
      FROM public.commodity 
      WHERE class_name IS NOT NULL AND TRIM(class_name) <> '' AND TRIM(sku_status_name) = 'Active'
    `;
    const uniqueNames = Array.from(new Set(rawClasses.map(c => c.class_name.trim()))).filter(Boolean);

    // 2. Sync any missing categories
    if (uniqueNames.length > 0) {
      await prisma.repair_category.createMany({
        data: uniqueNames.map(name => ({
          name,
          created_user: "system",
          updated_user: "system",
        })),
        skipDuplicates: true,
      });
    }

    // 3. Retrieve all categories
    const list = await prisma.repair_category.findMany({
      orderBy: { name: "asc" },
    });

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
    const { name, name_th, active_flg, updatedUser } = body;

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
        name_th: name_th ? name_th.trim() : null,
        active_flg: active_flg || "Y",
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
    const { id, name, name_th, active_flg, updatedUser } = body;

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

    // Validation: if changing status to inactive ('N'), check if there are SKUs in commodity table
    if (active_flg === "N" && existing.active_flg !== "N") {
      const skuCount = await prisma.commodity.count({
        where: {
          class_name: {
            equals: existing.name.trim(),
            mode: "insensitive"
          }
        }
      });
      if (skuCount > 0) {
        return NextResponse.json({
          ok: false,
          message: `ไม่สามารถปิดใช้งานหมวดหมู่นี้ได้ เนื่องจากมีสินค้า (SKU) จำนวน ${skuCount} รายการใช้งานหมวดหมู่นี้อยู่`
        }, { status: 400 });
      }
    }

    await prisma.repair_category.update({
      where: { id: Number(id) },
      data: {
        name: name.trim(),
        name_th: name_th ? name_th.trim() : null,
        active_flg: active_flg || "Y",
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
    const confirmDelete = searchParams.get("confirm") === "true";

    if (!id) {
      return NextResponse.json({ ok: false, message: "ไม่พบ ID ที่ต้องการลบ" }, { status: 400 });
    }

    const existing = await prisma.repair_category.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, message: "ไม่พบหมวดหมู่ที่ต้องการลบ" }, { status: 404 });
    }

    // Validation: check if there are SKUs in commodity table before deleting
    const skuCount = await prisma.commodity.count({
      where: {
        class_name: {
          equals: existing.name.trim(),
          mode: "insensitive"
        }
      }
    });

    if (skuCount > 0 && !confirmDelete) {
      return NextResponse.json({
        ok: false,
        requireConfirm: true,
        message: `มีสินค้า (SKU) จำนวน ${skuCount} รายการใช้งานหมวดหมู่นี้อยู่ หากยืนยันการลบ ระบบจะลบสินค้าทั้ง ${skuCount} รายการนี้ออกจากตารางสินค้าด้วย ยืนยันการลบหมวดหมู่และสินค้าทั้งหมดหรือไม่?`
      });
    }

    // If confirmed and skuCount > 0, delete all commodities under this category first
    if (skuCount > 0) {
      await prisma.commodity.deleteMany({
        where: {
          class_name: {
            equals: existing.name.trim(),
            mode: "insensitive"
          }
        }
      });
    }

    await prisma.repair_category.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ ok: true, message: "ลบข้อมูลหมวดหมู่และสินค้าในกลุ่มสำเร็จ" });
  } catch (error) {
    console.error("DELETE /api/maintain/categories error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการลบข้อมูลหมวดหมู่" },
      { status: 500 }
    );
  }
}
