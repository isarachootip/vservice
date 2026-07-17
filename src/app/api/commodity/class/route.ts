import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export async function GET() {
  try {
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
