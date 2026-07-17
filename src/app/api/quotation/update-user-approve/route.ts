import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

type RepairOption = "Y" | "N" | null;

type QuotationUpdate = {
  quotationId: number;
  repairDecision: RepairOption;
  repairReason: string;
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
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  return "unknown";
}

export async function POST(req: Request) {
    try {
        const {
            requestId,
            quotationUpdates,
            approveFlg,
            approveDate,
            ticketNum,
            updatedUser,
            mode,
        } = await req.json();

        const ip = getClientIp(req);
        // SRS v2.1: DC → 260 (แจ้งผลการอนุมัติ), Vendor → 330
        const statusByMode = mode === "DC" ? 260 : mode === "VEN" ? 330 : null;
        const stepNoByMode = mode === "DC" ? "260" : mode === "VEN" ? "330" : null;

        if (!requestId) {
        return NextResponse.json({ error: "Missing request_Id" }, { status: 400 });
        }

        if (!Array.isArray(quotationUpdates)) {
            return NextResponse.json({ ok: false, message: "Missing quotationUpdates" }, { status: 400 });
        }

        //* แปลง id จาก string เป็น numb
        const idNum = typeof requestId === "string" ? Number(requestId) : requestId;
        const approveDateDt = approveDate ? new Date(approveDate) : null;

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

        await prisma.$transaction(
            (quotationUpdates as QuotationUpdate[]).map((q) =>
                prisma.quotation.update({
                    where: { id: q.quotationId },
                    data: {
                        user_repair_flg: q.repairDecision ?? "Y", 
                        user_repair_reason: q.repairReason ?? "",
                        user_approve_flg: approveFlg,
                        user_approve_date: approveDateDt,
                        ticket_no: ticketNum,
                        updated_user: updatedUser,
                    },
                })
            )
        );

        if (mode === "DC") {
            await prisma.repair_request.update({
                where: { id: idNum },
                data: {
                    status: statusByMode,
                    updated_user: updatedUser,
                },
            });
        }
        if (mode === "VEN") {
            await prisma.repair_request.update({
                where: { id: idNum },
                data: {
                    status: statusByMode,
                    updated_user: updatedUser,
                },
            });
        }

        const trans_log_text = "เพิ่มข้อมูลบันทึกการอนุมัติของลูกค้า ใบแจ้งซ่อม : " + res.request_no; 
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
    console.error("update quotation error:", err);
        return NextResponse.json(
            { ok: false, message: "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
            { status: 500 }
        );
    }
}
