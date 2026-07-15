import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

type Body = {
  Id?: number | string;
  status?: number;
  updatedUser?: string;
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
    const body = (await req.json().catch(() => ({}))) as Body;
    const ip = getClientIp(req);

    if (body.Id == null) {
      return NextResponse.json({ ok: false, message: "ID is NULL" }, { status: 400 });
    }

    const idNum = typeof body.Id === "string" ? Number(body.Id) : body.Id;
    if (!Number.isFinite(idNum)) {
      return NextResponse.json({ ok: false, message: "ID ต้องเป็นตัวเลข" }, { status: 400 });
    }

    const res = await prisma.repair_request.findUnique({
      where: { id: idNum },
      select: {
        id: true,
        request_no: true,
        reject_flg: true,
      },
    });

    if (!res) {
      return NextResponse.json({ ok: false, message: "ไม่พบข้อมูลใบแจ้งซ่อม" }, { status: 404 });
    }

    if(res.reject_flg === "Y"){
      await prisma.repair_request.update({
        where: { id: idNum },
        data: {
          reject_flg: "N",
          status: body.status,
          updated_user: body.updatedUser,
        },
      });
    }else{
      await prisma.repair_request.update({
        where: { id: idNum },
        data: {
          status: body.status,
          updated_user: body.updatedUser,
        },
      });
    }

    let choice: string = "";
    if(body.status == 20){
      choice = "DC"
    }else if(body.status == 30){
      choice = "Vendor"
    }
    const trans_log_text = "ปรับสถานะใบแจ้งซ่อม : " + res.request_no + " จัดส่งให้ " + choice;
    await prisma.transaction_log.create({
      data: {
        act_user_name: body.updatedUser,
        act_ip_address: ip,
        act_trans_log: trans_log_text,
        step_no: String(body.status),
        request_id: idNum,
      }
    });

    return NextResponse.json({ ok: true, message: "อัปเดตข้อมูลสำเร็จ", requestId: idNum }, { status: 200 });
  } catch (err) {
    console.error("update request error:", err);
    return NextResponse.json(
      { ok: false, message: "อัปเดตไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
