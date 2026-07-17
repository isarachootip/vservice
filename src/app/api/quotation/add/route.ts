import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { UserService } from "@/lib/service/users.service";

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
  
  // Cost-plus additions
  cost_parts?: number;
  cost_labor?: number;
  cost_logistics?: number;
  margin_percent?: number;
  sell_price?: number;
  discount?: number;
  vat?: number;
  net_price?: number;
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
    const { items, updatedUser, mode, adminUser, adminPass, discountReason } = await req.json() as {
      items: QuotationItemInput[];
      updatedUser?: string;
      mode?: string;
      adminUser?: string | null;
      adminPass?: string | null;
      discountReason?: string;
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

    const reqRow = await prisma.repair_request.findUnique({
      where: { id: requestId },
      include: { repair_item: true }
    });
    if (!reqRow) {
      return NextResponse.json({ ok: false, message: "ไม่พบข้อมูลใบแจ้งซ่อม" }, { status: 404 });
    }

    // Verify margin floor constraint
    const marginConfigs = await prisma.margin_config.findMany();
    const productType = reqRow.repair_item[0]?.product_type || "General";
    
    let floorMargin = 15; // default fallback
    const matchedCfg = marginConfigs.find(c => 
      productType.toLowerCase().includes(c.product_type.toLowerCase()) ||
      c.product_type.toLowerCase().includes(productType.toLowerCase())
    );
    if (matchedCfg) {
      floorMargin = parseFloat(matchedCfg.margin_floor.toString());
    } else {
      const gen = marginConfigs.find(c => c.product_type.includes("General"));
      if (gen) floorMargin = parseFloat(gen.margin_floor.toString());
    }

    const itemsWithLowMargin = items.filter(it => (it.margin_percent ?? 0) < floorMargin);
    let approverName: string | null = null;
    if (itemsWithLowMargin.length > 0) {
      if (!adminUser || !adminPass) {
        return NextResponse.json(
          { ok: false, message: `มีบางรายการที่มี Margin (${itemsWithLowMargin[0].margin_percent}%) ต่ำกว่า Margin ขั้นต่ำ (${floorMargin}%) ของหมวดหมู่ ${productType} กรุณาระบุรหัสผ่านผู้ดูแลระบบ (Admin Bypass) เพื่ออนุมัติ` },
          { status: 403 }
        );
      }
      
      const adminAuth = await UserService.validateLogin(adminUser, adminPass);
      // roles_id 4 is ADMIN
      if (!adminAuth || adminAuth.roles_id !== 4) {
        return NextResponse.json(
          { ok: false, message: "สิทธิ์หรือรหัสผ่านผู้ดูแลระบบ (Admin Bypass) ไม่ถูกต้อง" },
          { status: 403 }
        );
      }
      approverName = adminAuth.user_name;
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
        
        // V2.0 fields
        cost_parts: it.cost_parts ?? 0,
        cost_labor: it.cost_labor ?? 0,
        cost_logistics: it.cost_logistics ?? 0,
        margin_percent: it.margin_percent ?? 0,
        sell_price: it.sell_price ?? 0,
        discount: it.discount ?? 0,
        vat: it.vat ?? 0,
        net_price: it.net_price ?? 0,
        version: 1,
        mode: mode
      })),
    });

    let trans_log_text = `เปิดใบเสนอราคา ของใบแจ้งซ่อม : ${reqRow.request_no} | เลขที่ใบเสนอราคา: ${items[0].quotation_no}`;
    if (approverName) {
      trans_log_text += ` | ผู้อนุมัติ Margin พิเศษ: ${approverName}`;
    }
    if (discountReason) {
      trans_log_text += ` | เหตุผลส่วนลด: ${discountReason}`;
    }

    await prisma.transaction_log.create({
      data: {
        act_user_name: updatedUser,
        act_ip_address: ip,
        act_trans_log: trans_log_text,
        step_no: stepNoByMode,
        request_id: requestId,
      },
    });

    // Trigger customer notification for quotation completed
    try {
      const { NotificationService } = await import("@/lib/service/notification.service");
      await NotificationService.sendNotification(requestId, "QUOTATION");
    } catch (e) {
      console.error("⚠️ Failed to trigger quotation notification:", e);
    }
    
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