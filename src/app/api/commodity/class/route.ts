import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const brand = (searchParams.get("brand") ?? "").trim();

    if (brand) {
      const rows = await prisma.$queryRaw<{ class_name: string }[]>`
        SELECT DISTINCT
          TRIM(c.class_name) AS class_name
        FROM public.commodity c
        WHERE
          TRIM(c.brand) = TRIM(${brand})
          AND TRIM(c.class_name) <> ''
          AND c.class_name IS NOT NULL
          AND TRIM(c.sku_status_name) = 'Active'
        ORDER BY TRIM(c.class_name)
      `;
      const data = rows.map(r => r.class_name);
      return NextResponse.json({ ok: true, data });
    }

    const rows = await prisma.repair_category.findMany({
      orderBy: { name: "asc" },
    });
    const data = rows.map(r => r.name);
    
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("get classes error:", err);
    return NextResponse.json({ message: "โหลด class ไม่สำเร็จ" }, { status: 500 });
  }
}
