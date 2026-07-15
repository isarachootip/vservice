import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = Number(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { ok: false, message: "ID ผู้ใช้งานไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { fullName, email, password, rolesId, storeCode, isActive, updatedUser } = body;

    const existing = await prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, message: "ไม่พบข้อมูลผู้ใช้งานนี้ในระบบ" },
        { status: 404 }
      );
    }

    const updateData: any = {
      user_full_name: fullName?.trim() || null,
      user_email: email?.trim() || existing.user_email,
      roles_id: rolesId ? Number(rolesId) : existing.roles_id,
      store_code: storeCode?.trim() || null,
      is_active: isActive !== undefined ? Number(isActive) : existing.is_active,
      updated_user: updatedUser || "admin",
    };

    if (password && password.trim().length > 0) {
      updateData.user_password = await bcrypt.hash(password, 10);
    }

    await prisma.users.update({
      where: { user_id: userId },
      data: updateData,
    });

    return NextResponse.json({ ok: true, message: "อัปเดตข้อมูลผู้ใช้งานสำเร็จ" });
  } catch (error) {
    console.error("PUT /api/maintain/users/[id] error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้งาน" },
      { status: 500 }
    );
  }
}
