import { NextResponse } from "next/server";
import { CommodityRepository } from "@/lib/repository/commodity.repo";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const className = (searchParams.get("class") ?? "").trim();

    const rows = await CommodityRepository.getBrand(className);
    const data = Array.from(
      new Set(rows.map(r => (r.brand ?? "").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("get subclasses error:", err);
    return NextResponse.json({ message: "โหลด brand ไม่สำเร็จ" }, { status: 500 });
  }
}
