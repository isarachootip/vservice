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
  return "unknown";
}

export async function POST(req: Request) {
  try {
    const { request_id, payment_type, amount, method, ref_no, receipt_no, updatedUser } = await req.json();

    if (!request_id || !payment_type || !amount || !method) {
      return NextResponse.json(
        { ok: false, message: "กรุณาระบุข้อมูลการชำระเงินให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const idNum = Number(request_id);
    const amtNum = parseFloat(amount);

    if (Number.isNaN(idNum) || Number.isNaN(amtNum)) {
      return NextResponse.json(
        { ok: false, message: "ข้อมูลตัวเลขไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const request = await prisma.repair_request.findUnique({
      where: { id: idNum },
      select: { id: true, request_no: true }
    });

    if (!request) {
      return NextResponse.json(
        { ok: false, message: "ไม่พบข้อมูลใบแจ้งซ่อม" },
        { status: 404 }
      );
    }

    // Generate receipt number if not provided
    let finalReceiptNo = receipt_no;
    if (!finalReceiptNo) {
      const prefix = "REC";
      const now = new Date();
      const yy = Number(String(now.getFullYear()).slice(-2));
      const mm = now.getMonth() + 1;
      const dd = now.getDate();

      const row = await prisma.running_doc.upsert({
        where: { unique_running_doc_by_day: { prefix, yy, mm, dd } },
        create: { prefix, yy, mm, dd, running_no: BigInt(1) },
        update: { running_no: { increment: BigInt(1) } },
      });

      const pad2 = (n: number) => String(n).padStart(2, "0");
      const pad4 = (n: bigint) => n.toString().padStart(4, "0");
      finalReceiptNo = `${prefix}${pad2(dd)}${pad2(mm)}${pad2(yy)}${pad4(row.running_no ?? BigInt(1))}`;
    }

    const payment = await prisma.payment_transaction.create({
      data: {
        request_id: idNum,
        payment_type,
        amount: amtNum,
        method,
        ref_no: ref_no || null,
        receipt_no: finalReceiptNo,
        received_by: updatedUser || "system",
        status: "CONFIRMED"
      }
    });

    // Create transaction log
    const ip = getClientIp(req);
    await prisma.transaction_log.create({
      data: {
        act_user_name: updatedUser || "system",
        act_ip_address: ip,
        act_trans_log: `บันทึกชำระเงิน (${payment_type}): จำนวน ${amtNum.toFixed(2)} บาท เลขที่ใบเสร็จ ${finalReceiptNo} ผ่าน ${method}`,
        step_no: "PAY",
        request_id: idNum,
      }
    });

    return NextResponse.json({
      ok: true,
      message: "บันทึกชำระเงินสำเร็จ",
      payment: {
        ...payment,
        amount: Number(payment.amount)
      }
    });
  } catch (error) {
    console.error("Record payment error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการบันทึกการชำระเงิน" },
      { status: 500 }
    );
  }
}
