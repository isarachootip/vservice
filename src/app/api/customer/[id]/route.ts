import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "@/lib/authen";
import { UserService } from "@/lib/service/users.service";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

// GET /api/customer/[id] - Get single customer details with addresses and repair history
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const customerId = parseInt(id, 10);

    if (isNaN(customerId)) {
      return NextResponse.json({ ok: false, message: "ID ลูกค้าไม่ถูกต้อง" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        addresses: true,
        repair_requests: {
          orderBy: { created_date: "desc" },
          take: 50 // Limit to last 50 tickets
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ ok: false, message: "ไม่พบข้อมูลลูกค้า" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, customer });
  } catch (err) {
    console.error("Get customer error:", err);
    return NextResponse.json({ ok: false, message: "เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า" }, { status: 500 });
  }
}

// PUT /api/customer/[id] - Update customer name, phone, and addresses
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const customerId = parseInt(id, 10);
    if (isNaN(customerId)) {
      return NextResponse.json({ ok: false, message: "ID ลูกค้าไม่ถูกต้อง" }, { status: 400 });
    }

    const body = await req.json();
    const { name, phone, addresses = [] } = body;

    if (!name || !phone) {
      return NextResponse.json({ ok: false, message: "กรุณากรอกชื่อและเบอร์โทรศัพท์" }, { status: 400 });
    }

    // Check unique phone number with other customers
    const duplicate = await prisma.customer.findFirst({
      where: {
        phone: phone.trim(),
        NOT: { id: customerId }
      }
    });

    if (duplicate) {
      return NextResponse.json({ ok: false, message: "เบอร์โทรศัพท์นี้ถูกใช้งานโดยลูกค้ารายอื่นแล้ว" }, { status: 400 });
    }

    // Perform transaction to update customer and replace addresses
    const updatedCustomer = await prisma.$transaction(async (tx) => {
      // 1. Update basic info
      const cust = await tx.customer.update({
        where: { id: customerId },
        data: {
          name: name.trim(),
          phone: phone.trim(),
          updated_date: new Date()
        }
      });

      // 2. Delete existing addresses
      await tx.customer_address.deleteMany({
        where: { customer_id: customerId }
      });

      // 3. Create new addresses
      if (addresses.length > 0) {
        await tx.customer_address.createMany({
          data: addresses.map((addr: any) => ({
            customer_id: customerId,
            address_type: addr.address_type || "SHIPPING",
            address_detail: addr.address_detail || ""
          }))
        });
      }

      return tx.customer.findUnique({
        where: { id: customerId },
        include: { addresses: true }
      });
    });

    return NextResponse.json({ ok: true, customer: updatedCustomer });
  } catch (err) {
    console.error("Update customer error:", err);
    return NextResponse.json({ ok: false, message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลลูกค้า" }, { status: 500 });
  }
}

// DELETE /api/customer/[id] - Delete customer (associated addresses cascade deleted, requests set to NULL)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Only allow admins to delete customers (optional safety, let's keep it simple or align with admin roles)
    const isAdmin = profile.role === "ADMIN" || profile.role === "ADMIN_GR";
    if (!isAdmin) {
      return NextResponse.json({ ok: false, message: "ไม่มีสิทธิ์ในการลบข้อมูลลูกค้า" }, { status: 403 });
    }

    const { id } = await params;
    const customerId = parseInt(id, 10);
    if (isNaN(customerId)) {
      return NextResponse.json({ ok: false, message: "ID ลูกค้าไม่ถูกต้อง" }, { status: 400 });
    }

    await prisma.customer.delete({
      where: { id: customerId }
    });

    return NextResponse.json({ ok: true, message: "ลบข้อมูลลูกค้าเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("Delete customer error:", err);
    return NextResponse.json({ ok: false, message: "เกิดข้อผิดพลาดในการลบข้อมูลลูกค้า" }, { status: 500 });
  }
}
