import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const brand = (searchParams.get("brand") ?? "").trim();
    const className = (searchParams.get("class") ?? "").trim();

    if (!brand || !className) {
      return NextResponse.json({ ok: false, message: "Missing brand or class" }, { status: 400 });
    }

    const rows = await prisma.$queryRaw<{ sku: string; bar_code: string; sku_name: string }[]>`
      SELECT 
        c.sku::text        AS sku,
        c.sbc::text        AS bar_code,
        trim(c.sku_name)   AS sku_name
      FROM public.commodity c
      WHERE 
        trim(c.brand) = trim(${brand})
        AND trim(c.class_name) = trim(${className})
        AND trim(c.sku_status_name) = 'Active'
      ORDER BY trim(c.sku_name)
    `;

    return NextResponse.json({ ok: true, data: rows });
  } catch (err) {
    console.error("get commodity list error:", err);
    return NextResponse.json({ message: "โหลดรายการสินค้าไม่สำเร็จ" }, { status: 500 });
  }
}
