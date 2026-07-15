import { NextResponse } from "next/server";
import { CommodityRepository } from "@/lib/repository/commodity.repo";

export async function GET() {
  try {
    const rows = await CommodityRepository.getClasses();
    const data = Array.from(
      new Set(
        rows
          .map(r => (r.class_name ?? "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
    
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("get classes error:", err);
    return NextResponse.json({ message: "โหลด class ไม่สำเร็จ" }, { status: 500 });
  }
}
