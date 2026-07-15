import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function GET() {
  try {
    const list = await prisma.users.findMany({
      include: {
        user_roles: true,
      },
      orderBy: { user_id: "asc" },
    });

    const storeCodes = Array.from(new Set(list.map((u) => u.store_code).filter(Boolean))) as string[];
    const stores = storeCodes.length
      ? await prisma.store.findMany({
          where: { store_code: { in: storeCodes } },
          select: { store_code: true, store_nick3: true },
        })
      : [];
    const storeMap = new Map(stores.map((s) => [s.store_code, s.store_nick3]));

    const users = list.map((u) => ({
      user_id: u.user_id,
      user_name: u.user_name,
      user_full_name: u.user_full_name,
      user_email: u.user_email,
      store_code: u.store_code,
      store_nick: u.store_code ? storeMap.get(u.store_code) || u.store_code : "-",
      roles_id: u.roles_id,
      role_name: u.user_roles?.roles_name || "-",
      is_active: u.is_active,
    }));

    return NextResponse.json({ ok: true, users });
  } catch (error) {
    console.error("GET /api/maintain/users error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, fullName, email, password, rolesId, storeCode, updatedUser } = body;

    if (!username || !email || !password || !rolesId) {
      return NextResponse.json(
        { ok: false, message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const existing = await prisma.users.findUnique({
      where: { user_name: username.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, message: "ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.users.create({
      data: {
        user_name: username.trim(),
        user_full_name: fullName?.trim() || null,
        user_email: email.trim(),
        user_password: hashedPassword,
        roles_id: Number(rolesId),
        store_code: storeCode?.trim() || null,
        is_active: 1,
        created_user: updatedUser || "admin",
        updated_user: updatedUser || "admin",
      },
    });

    return NextResponse.json({
      ok: true,
      message: "สร้างผู้ใช้งานสำเร็จ",
      userId: newUser.user_id,
    });
  } catch (error) {
    console.error("POST /api/maintain/users error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้ใช้งาน" },
      { status: 500 }
    );
  }
}
