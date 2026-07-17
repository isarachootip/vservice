import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const q = (searchParams.get("q") || "").trim();

        // Retrieve all quotations from prisma, including repair_request details
        const quotations = await prisma.quotation.findMany({
            include: {
                repair_request: {
                    select: {
                        customer_name: true,
                        request_no: true,
                        status: true,
                        vendor_name: true,
                    }
                }
            },
            orderBy: {
                id: "desc"
            }
        });

        // Group by quotation_no (or request_id if quotation_no is missing)
        const groups: Record<string, any> = {};
        for (const item of quotations) {
            const key = item.quotation_no ? item.quotation_no.trim() : `REQ-${item.request_id}`;
            if (!groups[key]) {
                groups[key] = {
                    quotation_no: item.quotation_no || "-",
                    request_id: item.request_id,
                    ticket_no: item.repair_request?.request_no || item.ticket_no || "-",
                    customer_name: item.repair_request?.customer_name || "-",
                    vendor_name: item.repair_request?.vendor_name || "-",
                    review_price_date: item.review_price_date,
                    user_approve_flg: item.user_approve_flg,
                    user_approve_date: item.user_approve_date,
                    num_of_repair_day: item.num_of_repair_day,
                    num_of_guarantee_day: item.num_of_guarantee_day,
                    created_date: item.created_date,
                    created_user: item.created_user,
                    items: [],
                    total_part_cost: 0,
                    total_labor_cost: 0,
                    grand_total: 0,
                };
            }
            groups[key].items.push({
                id: item.id,
                repair_order: item.repair_order,
                part_cost: Number(item.part_cost),
                part_warranty_flg: item.part_warranty_flg,
                labor_cost: Number(item.labor_cost),
                labor_warranty_flg: item.labor_warranty_flg,
                total_part_cost: Number(item.total_part_cost),
                total_labor_cost: Number(item.total_labor_cost),
                total_cost: Number(item.total_cost),
            });
            groups[key].total_part_cost += Number(item.total_part_cost);
            groups[key].total_labor_cost += Number(item.total_labor_cost);
            groups[key].grand_total += Number(item.total_cost);
        }

        let result = Object.values(groups);

        // Apply query filter if present
        if (q) {
            const query = q.toLowerCase();
            result = result.filter(item => 
                String(item.quotation_no).toLowerCase().includes(query) ||
                String(item.ticket_no).toLowerCase().includes(query) ||
                String(item.customer_name).toLowerCase().includes(query) ||
                String(item.vendor_name).toLowerCase().includes(query)
            );
        }

        return NextResponse.json({ ok: true, data: result });
    } catch (error) {
        console.error("API GET Quotation error:", error);
        return NextResponse.json(
            { ok: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลใบเสนอราคา" },
            { status: 500 }
        );
    }
}
