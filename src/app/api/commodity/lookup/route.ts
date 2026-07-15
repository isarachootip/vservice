import { NextResponse } from "next/server";
import { CommodityRepository } from "@/lib/repository/commodity.repo";

export const runtime = "nodejs";

export async function GET(req: Request) {
    try{
        const { searchParams } = new URL(req.url);
        const sku = (searchParams.get("sku") || "").trim();

        if (!sku) {
            return NextResponse.json({ ok: false, message: "missing sku" }, { status: 400 });
        }
        const data = await CommodityRepository.findBySku(sku);
        return NextResponse.json({ ok: true, data });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ ok: false, message: "server error" }, { status: 500 });
    }
}