import { NextResponse } from "next/server";
import { DashboardService } from "@/lib/service/dashboard-summary.service";

export const runtime = "nodejs";

type PeriodFilter = "all" | "day" | "week" | "month";

function isValidPeriod(value: string | null): value is PeriodFilter {
  return value === "all" || value === "day" || value === "week" || value === "month";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawPeriod = searchParams.get("period");
    const locationId = searchParams.get("locationId") || undefined;
    // console.log("[period] : ",rawPeriod, "[locationId] : ",locationId)
    const period: PeriodFilter = isValidPeriod(rawPeriod) ? rawPeriod : "all";
    const data = await DashboardService.getSummary(period, locationId);
    return NextResponse.json(
      { ok: true, data },
      { status: 200 }
    );
  } catch (error) {
    console.error("dashboard summary error:", error);
    return NextResponse.json(
      { ok: false, message: "โหลดข้อมูล dashboard ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}