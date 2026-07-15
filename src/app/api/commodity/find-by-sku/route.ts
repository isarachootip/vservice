import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const skuParam = (searchParams.get("sku") || "").trim();

    if (!skuParam) {
        return NextResponse.json(
            { ok: false, message: "sku is null" },
            { status: 400 }
        );
    }

    const n = Number(skuParam);
    if (Number.isNaN(n)) {
        return NextResponse.json(
            { ok: false, message: "sku invalid" },
            { status: 400 }
        );
    }

    const convertToNumber = (
        value: bigint | number | null | undefined
        ): number | null => {

        if (value == null) return null;

        return typeof value === "bigint"
            ? Number(value)
            : value;
    };

    const objData = await prisma.commodity.findFirst({
        where: {
            sku: n,
            sku_status_name: "Active",
        },
    });

    if (!objData) {
        return NextResponse.json(
            { ok: false, message: "ไม่พบข้อมูล" },
            { status: 404 }
        );
    }

    const payload = {
        sku: convertToNumber(objData.sku),
        sku_name: objData.sku_name?.trim() ?? "",
        sku_condition: convertToNumber(objData.sku_condition),
        sku_condition_name: objData.sku_condition_name?.trim() ?? "",

        brand_id: objData.brand_id,
        brand: objData.brand?.trim() ?? "",

        model: objData.model?.trim() ?? "",

        vendor_no: convertToNumber(objData.vendor_no),
        vendor_name: objData.vendor_name?.trim() ?? "",

        class_no: convertToNumber(objData.class_no),
        class_name: objData.class_name?.trim() ?? "",

        sku_status_code: objData.sku_status_code,
        sku_status_name: objData.sku_status_name?.trim() ?? "",

        distrmcode: convertToNumber(objData.distrmcode),
    };

    return NextResponse.json({ ok: true, request: payload });
}
