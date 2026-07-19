import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "@/lib/authen";
import { UserService } from "@/lib/service/users.service";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    const username = String(payload.sub || "");
    const profile = await UserService.getUserProfile(username);
    if (!profile) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const phone = (searchParams.get("phone") || "").trim();

    if (!phone) {
      return NextResponse.json({ ok: false, message: "กรุณาระบุเบอร์โทรศัพท์" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { phone: phone },
      include: {
        addresses: true
      }
    });

    if (!customer) {
      return NextResponse.json({ ok: false, message: "ไม่พบข้อมูลลูกค้า" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, customer });
  } catch (err) {
    console.error("Lookup customer error:", err);
    return NextResponse.json({ ok: false, message: "เกิดข้อผิดพลาดในการค้นหาข้อมูลลูกค้า" }, { status: 500 });
  }
}
