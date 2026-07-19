import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "@/lib/authen";
import { UserService } from "@/lib/service/users.service";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

// GET /api/customer - List customers with search & pagination
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
    const search = (searchParams.get("search") || "").trim();
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } }
      ];
    }

    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        include: {
          addresses: true,
          _count: {
            select: { repair_requests: true }
          }
        },
        orderBy: { created_date: "desc" },
        skip,
        take: limit
      }),
      prisma.customer.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      ok: true,
      customers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });
  } catch (err) {
    console.error("List customers error:", err);
    return NextResponse.json({ ok: false, message: "เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า" }, { status: 500 });
  }
}

// POST /api/customer - Create a new customer manually
export async function POST(req: Request) {
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

    const body = await req.json();
    const { name, phone, addresses = [] } = body;

    if (!name || !phone) {
      return NextResponse.json({ ok: false, message: "กรุณากรอกชื่อและเบอร์โทรศัพท์" }, { status: 400 });
    }

    // Check unique phone number
    const existing = await prisma.customer.findUnique({
      where: { phone: phone.trim() }
    });

    if (existing) {
      return NextResponse.json({ ok: false, message: "เบอร์โทรศัพท์นี้ถูกใช้งานแล้วในระบบ" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        addresses: {
          create: addresses.map((addr: any) => ({
            address_type: addr.address_type || "SHIPPING",
            address_detail: addr.address_detail || ""
          }))
        }
      },
      include: {
        addresses: true
      }
    });

    return NextResponse.json({ ok: true, customer }, { status: 201 });
  } catch (err) {
    console.error("Create customer error:", err);
    return NextResponse.json({ ok: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูลลูกค้า" }, { status: 500 });
  }
}
