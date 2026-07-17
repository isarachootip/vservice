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
      `;
      const classNames = rows.map(r => r.class_name.trim());

      const activeCategories = await prisma.repair_category.findMany({
        where: {
          name: { in: classNames },
          active_flg: "Y"
        },
        orderBy: { name: "asc" }
      });

      const data = activeCategories.map(r => ({ name: r.name, name_th: r.name_th }));
      return NextResponse.json({ ok: true, data });
    }

    const rows = await prisma.repair_category.findMany({
      where: { active_flg: "Y" },
      orderBy: { name: "asc" },
    });
    const data = rows.map(r => ({ name: r.name, name_th: r.name_th }));
    
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("get classes error:", err);
    return NextResponse.json({ message: "โหลด class ไม่สำเร็จ" }, { status: 500 });
  }
}
