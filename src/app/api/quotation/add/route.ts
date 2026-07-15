import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

type QuotationItemInput = {
  request_id: number;
  review_price_date: string | null;
  repair_order: string;
  part_cost: number;
  part_warranty_flg: string;
  labor_cost: number;
  labor_warranty_flg: string;
  total_part_cost: number;
  total_labor_cost: number;
  total_cost: number;
  user_approve_flg: string;
  num_of_repair_day: string;
  num_of_guarantee_day: string;
  quotation_no: string;
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
    const { items, updatedUser, mode } = await req.json() as {
      items: QuotationItemInput[];
      updatedUser?: string;
      mode?: string;
    };
    const ip = getClientIp(req);

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { ok: false, message: "ไม่มีข้อมูลรายการใบเสนอราคา" },
        { status: 400 }
      );
    }

    const requestId = items[0].request_id;

    if (!requestId) {
      return NextResponse.json(
        { ok: false, message: "ไม่พบ request_id" },
        { status: 400 }
      );
    }

    const res = await prisma.repair_request.findUnique({
    where: { id: requestId },
      select: {
        id: true,
        request_no: true,
      },
    });
    if (!res) {
      return NextResponse.json({ ok: false, message: "ไม่พบข้อมูลใบแจ้งซ่อม" }, { status: 404 });
    }

    const statusByMode = mode === "DC" ? 232 : mode === "VEN" ? 32 : null;
    const stepNoByMode = mode === "DC" ? "232" : mode === "VEN" ? "32" : null;

    if (!statusByMode || !stepNoByMode) {
      return NextResponse.json(
        { ok: false, message: "Invalid mode. Must be 'DC' or 'VEN'" },
        { status: 400 }
      );
    }

    //* update status request
    await prisma.repair_request.update({
      where: { id: requestId },
      data: {
        status: statusByMode,
        updated_user: updatedUser,
      },
    });

    //* create quotation
    await prisma.quotation.createMany({
      data: items.map((it: QuotationItemInput) => ({
        request_id: it.request_id,
        review_price_date: it.review_price_date
          ? new Date(it.review_price_date)
          : null,
        repair_order: it.repair_order ?? "",
        part_cost: it.part_cost,
        part_warranty_flg: it.part_warranty_flg,
        labor_cost: it.labor_cost,
        labor_warranty_flg: it.labor_warranty_flg,
        total_part_cost: it.total_part_cost,
        total_labor_cost: it.total_labor_cost,
        total_cost: it.total_cost,
        user_approve_flg: it.user_approve_flg ?? "N",
        num_of_repair_day: it.num_of_repair_day,
        num_of_guarantee_day: it.num_of_guarantee_day,
        quotation_no: it.quotation_no,
        created_user: updatedUser,
        updated_user: updatedUser,
      })),
    });

    const trans_log_text = "เปิดใบเสนอราคา ของใบแจ้งซ่อม : " + res.request_no;
    await prisma.transaction_log.create({
      data: {
        act_user_name: updatedUser,
        act_ip_address: ip,
        act_trans_log: trans_log_text,
        step_no: stepNoByMode,
        request_id: requestId,
      },
    });
    
    return NextResponse.json(
      { ok: true, message: "บันทึกใบเสนอราคาสำเร็จ" },
      { status: 200 }
    );
  } catch (err) {
    console.error("save quotation error:", err);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" },
      { status: 500 }
    );
  }
}