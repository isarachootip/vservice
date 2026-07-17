import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

export async function GET() {
  try {
    const list = await prisma.symptom.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json({ ok: true, symptoms: list });
  } catch (error) {
    console.error("GET /api/maintain/symptoms error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลอาการเสีย" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, category, updatedUser } = body;

    if (!name) {
      return NextResponse.json({ ok: false, message: "กรุณาระบุชื่ออาการเสีย" }, { status: 400 });
    }

    const newSymptom = await prisma.symptom.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category?.trim() || null,
        created_user: updatedUser || "admin",
        updated_user: updatedUser || "admin",
      },
    });

    return NextResponse.json({ ok: true, message: "สร้างข้อมูลอาการเสียสำเร็จ", id: newSymptom.id });
  } catch (error) {
    console.error("POST /api/maintain/symptoms error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูลอาการเสีย" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, description, category, updatedUser } = body;

    if (!id || !name) {
      return NextResponse.json({ ok: false, message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const existing = await prisma.symptom.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, message: "ไม่พบข้อมูลอาการเสีย" }, { status: 404 });
    }

    await prisma.symptom.update({
      where: { id: Number(id) },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category?.trim() || null,
        updated_user: updatedUser || "admin",
        updated_date: new Date(),
      },
    });

    return NextResponse.json({ ok: true, message: "อัปเดตข้อมูลอาการเสียสำเร็จ" });
  } catch (error) {
    console.error("PUT /api/maintain/symptoms error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลอาการเสีย" },
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

    await prisma.symptom.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ ok: true, message: "ลบข้อมูลอาการเสียสำเร็จ" });
  } catch (error) {
    console.error("DELETE /api/maintain/symptoms error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการลบข้อมูลอาการเสีย" },
      { status: 500 }
    );
  }
}
