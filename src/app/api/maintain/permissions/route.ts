import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

export async function GET() {
  try {
    const roles = await prisma.user_roles.findMany({
      orderBy: { roles_id: "asc" },
    });

    const activePermissions = await prisma.user_roles_has_permission.findMany({
      where: {
        permission: {
          permission_name: "add_request",
        },
        status: 1,
      },
      select: {
        user_roles_roles_id: true,
      },
    });

    const activeRoleIds = new Set(activePermissions.map((p) => p.user_roles_roles_id));

    const permissions = roles.map((r) => ({
      roles_id: r.roles_id,
      roles_name: r.roles_name,
      can_add_request: activeRoleIds.has(r.roles_id),
    }));

    return NextResponse.json({ ok: true, permissions });
  } catch (error) {
    console.error("GET /api/maintain/permissions error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลสิทธิ์การเข้าใช้งาน" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { toggles, updatedUser } = body;

    if (!Array.isArray(toggles)) {
      return NextResponse.json(
        { ok: false, message: "รูปแบบข้อมูลสิทธิ์ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    let perm = await prisma.permission.findFirst({
      where: { permission_name: "add_request" },
    });

    let permId: number;
    if (!perm) {
      const newPerm = await prisma.permission.create({
        data: {
          permission_name: "add_request",
          permission_desc: "สร้างใบแจ้งซ่อม (add_request)",
          created_user: "system",
          updated_user: "system",
        },
      });
      permId = newPerm.permission_id;
    } else {
      permId = perm.permission_id;
    }

    for (const toggle of toggles) {
      const { rolesId, enabled } = toggle;
      const existing = await prisma.user_roles_has_permission.findFirst({
        where: {
          user_roles_roles_id: Number(rolesId),
          permission_id: permId,
        },
      });

      if (enabled) {
        if (existing) {
          await prisma.user_roles_has_permission.update({
            where: { user_roles_has_permission_id: existing.user_roles_has_permission_id },
            data: {
              status: 1,
              updated_user: updatedUser || "admin",
              updated_date: new Date(),
            },
          });
        } else {
          await prisma.user_roles_has_permission.create({
            data: {
              user_roles_roles_id: Number(rolesId),
              permission_id: permId,
              status: 1,
              created_user: updatedUser || "admin",
              updated_user: updatedUser || "admin",
            },
          });
        }
      } else {
        if (existing) {
          await prisma.user_roles_has_permission.update({
            where: { user_roles_has_permission_id: existing.user_roles_has_permission_id },
            data: {
              status: 0,
              updated_user: updatedUser || "admin",
              updated_date: new Date(),
            },
          });
        }
      }
    }

    return NextResponse.json({ ok: true, message: "อัปเดตสิทธิ์การใช้งานสำเร็จ" });
  } catch (error) {
    console.error("PUT /api/maintain/permissions error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการบันทึกสิทธิ์การเข้าใช้งาน" },
      { status: 500 }
    );
  }
}
