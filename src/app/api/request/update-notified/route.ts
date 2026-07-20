import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  return "unknown";
}

export async function POST(req: Request) {
    try {
        const { requestId, notifierName, notifieDate, approveFlg, updatedUser, mode } = await req.json();
        const ip = getClientIp(req);

        if (!requestId) {
            return NextResponse.json({ error: "Missing request_Id" }, { status: 400 });
        }

        //* แปลง id จาก string เป็น numb
        const idNum = typeof requestId === "string" ? Number(requestId) : requestId;
        const notifieDateDt = notifieDate ? new Date(notifieDate) : null;

        const res = await prisma.repair_request.findUnique({
            where: { id: idNum },
            select: {
                id: true,
                request_no: true,
            },
        });
        if (!res) {
            return NextResponse.json({ ok: false, message: "ไม่พบข้อมูลใบแจ้งซ่อม" }, { status: 404 });
        }

        // SRS v2.1: DC อนุมัติ → 275, ไม่อนุมัติ → 270; Vendor อนุมัติ → 345, ไม่อนุมัติ → 340
        const statusByMode = mode === "DC"
            ? (approveFlg === "Y" ? 275 : 270)
            : mode === "VEN"
            ? (approveFlg === "Y" ? 345 : 340)
            : null;

        const stepNoByMode = mode === "DC"
            ? (approveFlg === "Y" ? "275" : "270")
            : mode === "VEN"
            ? (approveFlg === "Y" ? "345" : "340")
            : null;

        if (!statusByMode || !stepNoByMode) {
            return NextResponse.json(
                { ok: false, message: "Invalid mode. Must be 'DC' or 'VEN'" },
                { status: 400 }
            );
        }

        //* Update request status
        await prisma.repair_request.update({
            where: { id: idNum },
            data: {
                vendor_notified_by: notifierName,
                vendor_notified_date: notifieDateDt,
                status: statusByMode,
                updated_user: updatedUser,
                updated_date: new Date(),
                status_updated_date: new Date(),
            },
        });

        const trans_log_text = "เพิ่มข้อมูลบันทึกการแจ้ง Vendor ใบแจ้งซ่อม : " + res.request_no;
        await prisma.transaction_log.create({
            data: {
                act_user_name: updatedUser,
                act_ip_address: ip,
                act_trans_log: trans_log_text,
                step_no: stepNoByMode,
                request_id: idNum,
            }
        });

        return NextResponse.json({ ok: true, message: "บันทึกข้อมูลสำเร็จ", requestId: idNum }, { status: 200 });
    } catch (err) {
    console.error("update request notifie error :", err);
        return NextResponse.json(
            { ok: false, message: "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
            { status: 500 }
        );
    }
}
