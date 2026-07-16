import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (q) {
      whereClause.OR = [
        { sku_name: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { class_name: { contains: q, mode: "insensitive" } },
        { vendor_name: { contains: q, mode: "insensitive" } },
      ];
      // If it's a numeric search, we can try to search by SKU or barcode too
      if (/^\d+$/.test(q)) {
        const skuVal = BigInt(q);
        whereClause.OR.push({ sku: skuVal });
        whereClause.OR.push({ sbc: skuVal });
      }
    }

    const [total, items] = await Promise.all([
      prisma.commodity.count({ where: whereClause }),
      prisma.commodity.findMany({
        where: whereClause,
        orderBy: { sku: "asc" },
        skip,
        take: limit,
      }),
    ]);

    // Map BigInt to string for JSON serialization
    const serializedItems = items.map((item) => ({
      sku: item.sku.toString(),
      ibc: item.ibc?.toString() || null,
      sbc: item.sbc?.toString() || null,
      barcode2: item.barcode2?.toString() || null,
      barcode3: item.barcode3?.toString() || null,
      barcode4: item.barcode4?.toString() || null,
      barcode5: item.barcode5?.toString() || null,
      sku_name: item.sku_name,
      sku_condition: item.sku_condition,
      sku_condition_name: item.sku_condition_name,
      brand_id: item.brand_id,
      brand: item.brand,
      model: item.model,
      vendor_no: item.vendor_no,
      vendor_name: item.vendor_name,
      dept_no: item.dept_no,
      dept_name: item.dept_name,
      sdept_no: item.sdept_no,
      sdept_name: item.sdept_name,
      class_no: item.class_no,
      class_name: item.class_name,
      sclass_no: item.sclass_no,
      sclass_name: item.sclass_name,
      unit_code: item.unit_code,
      unit_name: item.unit_name,
      sku_status_code: item.sku_status_code,
      sku_status_name: item.sku_status_name,
      sku_price: item.sku_price,
      sku_cost: item.sku_cost,
    }));

    return NextResponse.json({
      ok: true,
      products: serializedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/maintain/products error:", error);
    return NextResponse.json(
      { ok: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { products } = body; // Array of product objects

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { ok: false, message: "ข้อมูลสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    let insertCount = 0;
    let updateCount = 0;

    // We can upsert in a transaction or individually
    for (const p of products) {
      if (!p.sku || !p.sku_name || !p.brand) {
        continue;
      }

      const sku = BigInt(p.sku);
      const sku_name = String(p.sku_name).trim();
      const brand = String(p.brand).trim();
      const class_name = String(p.class_name || p.category || "General").trim();
      const sku_cost = Number(p.sku_cost || p.cost || 0);
      const sku_price = Number(p.sku_price || p.price || 0);
      const vendor_no = Number(p.vendor_no || 0);
      const vendor_name = String(p.vendor_name || "").trim();

      const existing = await prisma.commodity.findFirst({
        where: { sku },
      });

      if (existing) {
        await prisma.commodity.update({
          where: { sku },
          data: {
            sku_name,
            brand,
            class_name,
            sku_cost,
            sku_price,
            vendor_no,
            vendor_name,
            sku_status_name: "Active",
          },
        });
        updateCount++;
      } else {
        await prisma.commodity.create({
          data: {
            sku,
            sku_name,
            brand,
            class_name,
            sku_cost,
            sku_price,
            vendor_no,
            vendor_name,
            sku_condition: 1,
            sku_condition_name: "New",
            dept_no: 1,
            dept_name: "General",
            sdept_no: 1,
            sdept_name: "General",
            class_no: 1,
            sclass_no: 1,
            sclass_name: "General",
            unit_code: "PC",
            unit_name: "Piece",
            sku_status_name: "Active",
          },
        });
        insertCount++;
      }
    }

    return NextResponse.json({
      ok: true,
      message: `นำเข้าข้อมูลสินค้าสำเร็จทั้งหมด ${products.length} รายการ (เพิ่มใหม่ ${insertCount}, อัปเดต ${updateCount})`,
    });
  } catch (error: any) {
    console.error("POST /api/maintain/products error:", error);
    return NextResponse.json(
      { ok: false, message: error.message || "เกิดข้อผิดพลาดในการนำเข้าข้อมูลสินค้า" },
      { status: 500 }
    );
  }
}
