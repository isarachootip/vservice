import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const activeOnly = url.searchParams.get("active") === "true";

    if (activeOnly) {
      const now = new Date();
      // Find announcements that are currently active:
      // start_date <= now and end_date >= now (or nulls)
      const list = await prisma.system_announcement.findMany({
        where: {
          OR: [
            {
              AND: [
                { OR: [{ start_date: null }, { start_date: { lte: now } }] },
                { OR: [{ end_date: null }, { end_date: { gte: now } }] },
              ],
            },
          ],
        },
        orderBy: { id: "desc" },
      });
      return NextResponse.json({ ok: true, announcements: list });
    } else {
      const list = await prisma.system_announcement.findMany({
        orderBy: { id: "desc" },
      });
      return NextResponse.json({ ok: true, announcements: list });
    }
  } catch (error) {
    console.error("GET /api/maintain/announcements error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลประกาศ" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, severity, startDate, endDate, createdUser } = body;

    if (!message) {
      return NextResponse.json({ ok: false, message: "กรุณาระบุข้อความประกาศ" }, { status: 400 });
    }

    const newAnnouncement = await prisma.system_announcement.create({
      data: {
        message: message.trim(),
        severity: severity || "warning",
        start_date: startDate ? new Date(startDate) : null,
        end_date: endDate ? new Date(endDate) : null,
        created_user: createdUser || "admin",
      },
    });

    return NextResponse.json({ ok: true, message: "สร้างประกาศสำเร็จ", id: newAnnouncement.id });
  } catch (error) {
    console.error("POST /api/maintain/announcements error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการบันทึกประกาศ" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, message: "กรุณาระบุ ID ของประกาศ" }, { status: 400 });
    }

    await prisma.system_announcement.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ ok: true, message: "ลบประกาศสำเร็จ" });
  } catch (error) {
    console.error("DELETE /api/maintain/announcements error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการลบประกาศ" },
      { status: 500 }
    );
  }
}
