import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

type Body = {
  Id?: number | string;
  updatedUser?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;

    if (body.Id == null) {
      return NextResponse.json({ ok: false, message: "ID is NULL" }, { status: 400 });
    }

    const idNum = typeof body.Id === "string" ? Number(body.Id) : body.Id;
    if (!Number.isFinite(idNum)) {
      return NextResponse.json({ ok: false, message: "ID ต้องเป็นตัวเลข" }, { status: 400 });
    }

    const res = await prisma.repair_request.findUnique({
      where: { id: idNum },
      select: {
        id: true,
      },
    });

    if (!res) {
      return NextResponse.json({ ok: false, message: "ไม่พบข้อมูลใบแจ้งซ่อม" }, { status: 404 });
    }

    await prisma.repair_request.update({
      where: { id: idNum },
      data: {
        status: 0,
        updated_user: body.updatedUser,
      },
    });


    return NextResponse.json({ ok: true, message: "อัปเดตข้อมูลสำเร็จ", requestId: idNum }, { status: 200 });
  } catch (err) {
    console.error("update request error:", err);
    return NextResponse.json(
      { ok: false, message: "อัปเดตไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
