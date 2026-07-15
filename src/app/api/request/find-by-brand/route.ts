import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const brand = searchParams.get("brand");
    const status = searchParams.get("status");
    const exId = Number(searchParams.get("id"));

    const items = await prisma.repair_item.findMany({
        where: {
            brand: brand ?? undefined,
            repair_request: {
                is: {
                ...(status && { status: Number(status) }),
                },
            },
            ...(exId && {
                NOT: {
                    repair_request: {
                        is: {
                            id: exId,
                        },
                    },
                },
            }),
        },
        include: {
            repair_request: true,
        },
    });

    return Response.json({
        items: items.map(i => ({
            id: i.repair_request.id,
            request_no: i.repair_request.request_no,
            store_code: i.repair_request.store_code,
            product_type: i.product_type,
            brand: i.brand,
            serial_no: i.serial_no,
            arrive_to_dc_date: i.repair_request.arrive_to_dc_date,
        })),
    });
}