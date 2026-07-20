import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { UserService } from "@/lib/service/users.service";

export const runtime = "nodejs";

type Body = {
  Id?: number | string;
  updatedUser?: string;
  cancelReason?: string;
  adminUser?: string | null;
  adminPass?: string | null;
};

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const ip = getClientIp(req);

    if (body.Id == null) {
      return NextResponse.json({ ok: false, message: "ID is NULL" }, { status: 400 });
    }

    const idNum = typeof body.Id === "string" ? Number(body.Id) : body.Id;
    if (!Number.isFinite(idNum)) {
      return NextResponse.json({ ok: false, message: "ID ต้องเป็นตัวเลข" }, { status: 400 });
    }

    const request = await prisma.repair_request.findUnique({
      where: { id: idNum },
      select: {
        id: true,
        request_no: true,
        status: true,
      },
    });

    if (!request) {
      return NextResponse.json({ ok: false, message: "ไม่พบข้อมูลใบแจ้งซ่อม" }, { status: 404 });
    }

    // FIX-02: ยกเลิกอิสระได้เฉพาะก่อนสินค้าถึง Vendor (SRS v2.1 หัวข้อ 10)
    const currentStatus = request.status ?? 0;
    const allowedStatuses = [100, 110, 200, 210, 300];
    const isAllowedSelf = allowedStatuses.includes(currentStatus);

    let approverName: string | null = null;

    if (!isAllowedSelf) {
      // Require Supervisor (ADMIN role) approval
      const { adminUser, adminPass } = body;
      if (!adminUser || !adminPass) {
        return NextResponse.json({
          ok: false,
          message: "การยกเลิกใบแจ้งซ่อมในสถานะนี้ ต้องได้รับการอนุมัติโดยผู้ดูแลระบบ (Supervisor Approval Required)"
        }, { status: 403 });
      }

      const adminAuth = await UserService.validateLogin(adminUser, adminPass);
      if (!adminAuth || adminAuth.roles_id !== 4) {
        return NextResponse.json({
          ok: false,
          message: "สิทธิ์หรือรหัสผ่านผู้ดูแลระบบไม่ถูกต้อง"
        }, { status: 403 });
      }
      approverName = adminAuth.user_name;
    }

    // Require reason for cancellation
    const reason = body.cancelReason?.trim();
    if (!reason) {
      return NextResponse.json({
        ok: false,
        message: "กรุณาระบุเหตุผลในการยกเลิกใบแจ้งซ่อม"
      }, { status: 400 });
    }

    // Set status = 0 (000 = ยกเลิก)
    await prisma.repair_request.update({
      where: { id: idNum },
      data: {
        status: 0,
        updated_user: body.updatedUser,
        updated_date: new Date(),
        status_updated_date: new Date(),
      },
    });

    // Create transaction log
    let logText = `ยกเลิกใบแจ้งซ่อม: ${request.request_no} | เหตุผล: ${reason}`;
    if (approverName) {
      logText += ` | อนุมัติโดย Supervisor: ${approverName}`;
    }

    await prisma.transaction_log.create({
      data: {
        act_user_name: body.updatedUser || "system",
        act_ip_address: ip,
        act_trans_log: logText,
        step_no: "0",
        request_id: idNum,
      },
    });

    return NextResponse.json({ ok: true, message: "ยกเลิกใบแจ้งซ่อมสำเร็จ", requestId: idNum }, { status: 200 });
  } catch (err) {
    console.error("cancel request error:", err);
    return NextResponse.json(
      { ok: false, message: "ยกเลิกใบแจ้งซ่อมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
