import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const idParam = (searchParams.get("id") || "").trim();
        const getTransactionLog = searchParams.get("getTransactionLog") === "true";

        if (!idParam) {
            return NextResponse.json(
                { ok: false, message: "กรุณาระบุ ID ของใบแจ้งซ่อม" },
                { status: 400 }
            );
        }

        const n = Number(idParam);
        if (Number.isNaN(n)) {
            return NextResponse.json(
                { ok: false, message: "รูปแบบ ID ไม่ถูกต้อง" },
                { status: 400 }
            );
        }

        const convertToNumber = (value: bigint | number | null | undefined): number | null => {
            if (value == null) return null;
            return typeof value === "bigint" ? Number(value) : value;
        };

        const reqData = await prisma.repair_request.findFirst({
            where: { id: n },
            include: { 
                repair_item: true, 
                quotation: {
                    orderBy: { id: "asc" }, 
                }, 
                repair_attachment: true,
            },
        });

        if (!reqData) {
            return NextResponse.json({ ok: false, message: "ไม่พบข้อมูลใบแจ้งซ่อม" }, { status: 404 });
        }

        const items = (reqData.repair_item || []).map(it => ({
            id: it.id,
            product_type: it.product_type,
            brand: it.brand,
            model: it.model,
            serial_no: it.serial_no,
            qty: it.qty,
            in_warranty: it.in_warranty,
            issue: it.issue,
            bar_code: it.bar_code,
            sku_flg: it.sku_flg,
            sku_code: convertToNumber(it.sku_code),
            warranty_no: it.warranty_no,
            created_date: it.created_date,
            created_user: it.created_user,
            updated_date: it.updated_date,
            updated_user: it.updated_user,
        }));

        const attachments = (reqData.repair_attachment || []).map(atchm => ({
            id: atchm.id,
            request_id: atchm.request_id,  
            file_path: atchm.file_path,      
            file_name: atchm.file_name,    
            mime_type: atchm.mime_type,      
            file_size: atchm.file_size,    
            step_no: atchm.step_no,
        }));

        const quotations = (reqData.quotation || []).map(q => ({
            id: q.id,
            review_price_date: q.review_price_date,
            repair_order: q.repair_order ?? "",
            part_cost: q.part_cost != null ? Number(q.part_cost) : 0,
            part_warranty_flg: q.part_warranty_flg ?? "N",
            labor_cost: q.labor_cost != null ? Number(q.labor_cost) : 0,
            labor_warranty_flg: q.labor_warranty_flg ?? "N",
            total_part_cost: q.total_part_cost != null ? Number(q.total_part_cost) : 0,
            total_cost: q.total_cost != null ? Number(q.total_cost) : 0,
            user_approve_flg: q.user_approve_flg,
            user_approve_date: q.user_approve_date || null,
            user_repair_flg: q.user_repair_flg,
            user_repair_reason: q.user_repair_reason,
            num_of_repair_day:  q.num_of_repair_day,
            num_of_guarantee_day: q.num_of_guarantee_day,
            created_date: q.created_date,
            created_user: q.created_user,
            updated_date: q.updated_date,
            updated_user: q.updated_user,
            ticket_no: q.ticket_no,
            quotation_no: q.quotation_no,
        }));

        let transactionLogs: Array<{step_no: string | null; act_user_name: string | null; act_trans_log: string | null; act_date_time: Date | null}> = [];
        if (getTransactionLog) {
            const logs = await prisma.transaction_log.findMany({
                where: { request_id: n },
                select: {
                    step_no: true,
                    act_user_name: true,
                    act_trans_log: true,
                    act_date_time: true,
                },
                orderBy: { act_date_time: "asc" },
            });
            transactionLogs = logs;
        }

        const payload = {
            id: reqData.id,
            request_no: reqData.request_no,
            request_return_no: reqData.request_return_no,
            customer_name: reqData.customer_name,
            address: reqData.address,
            phone: reqData.phone,
            store_code: reqData.store_code,
            vendor_name: reqData.vendor_name,
            receive_from_user_date: reqData.receive_from_user_date,
            send_to_vendor_by: reqData.send_to_vendor_by,
            send_to_vendor_tel: reqData.send_to_vendor_tel,
            send_to_vendor_date: reqData.send_to_vendor_date,
            internal_flg: reqData.internal_flg,
            rollback_reason: reqData.rollback_reason,
            rollback_by: reqData.rollback_by,
            rollback_date: reqData.rollback_date,
            status: reqData.status,
            cs_send_to_gr_by: reqData.cs_send_to_gr_by,
            cs_send_to_gr_date: reqData.cs_send_to_gr_date,
            cs_to_gr_tel: reqData.cs_to_gr_tel,
            cs_to_gr_receive_by: reqData.cs_to_gr_receive_by,
            gr_open_dc_log_by: reqData.gr_open_dc_log_by,
            gr_open_dc_log_date: reqData.gr_open_dc_log_date,
            vendor_notified_by: reqData.vendor_notified_by,
            vendor_notified_date: reqData.vendor_notified_date,
            vendor_return_receive_by: reqData.vendor_return_receive_by,
            vendor_return_sent_by: reqData.vendor_return_sent_by,
            vendor_return_sender_tel: reqData.vendor_return_sender_tel,
            vendor_return_date: reqData.vendor_return_date,
            gr_send_return_to_cs_by: reqData.gr_send_return_to_cs_by,
            gr_send_return_to_cs_date: reqData.gr_send_return_to_cs_date,
            gr_send_return_to_cs_tel: reqData.gr_send_return_to_cs_tel,
            gr_send_return_to_cs_receive_by: reqData.gr_send_return_to_cs_receive_by,
            location: reqData.location,
            customer_receive_by: reqData.customer_receive_by,
            customer_receive_sent_by: reqData.customer_receive_sent_by,
            customer_receive_date: reqData.customer_receive_date,
            approvelog_id: reqData.approvelog_id,
            dc_receiver_name: reqData.dc_receiver_name,
            dc_receive_date: reqData.dc_receive_date,
            dc_receiver_tel: reqData.dc_receiver_tel,
            arrive_to_dc_date: reqData.arrive_to_dc_date,
            vendor_send_to_dc_by: reqData.vendor_send_to_dc_by,
            vendor_to_dc_tel: reqData.vendor_to_dc_tel,
            vendor_send_to_dc_date: reqData.vendor_send_to_dc_date,
            vendor_to_dc_receive_by: reqData.vendor_to_dc_receive_by,
            dc_return_send_by: reqData.dc_return_send_by,
            dc_return_date: reqData.dc_return_date,
            dc_return_tel: reqData.dc_return_tel,
            dc_return_receive_by: reqData.dc_return_receive_by,
            dc_rej_return_send_by: reqData.dc_rej_return_send_by,
            dc_rej_return_date: reqData.dc_rej_return_date,
            dc_rej_return_tel: reqData.dc_rej_return_tel,
            dc_rej_return_receive_by: reqData.dc_rej_return_receive_by,
            reject_flg: reqData.reject_flg,
            reject_from_status: reqData.reject_from_status,
            created_date: reqData.created_date,
            created_user: reqData.created_user,
            updated_date: reqData.updated_date,
            updated_user: reqData.updated_user,
            item: items[0] ?? null,
            repair_attachment: attachments,
            quotation: quotations,
        };

        return NextResponse.json({ ok: true, request: payload, transactionLogs });
    } catch (error) {
        console.error("API GET Request error:", error);
        return NextResponse.json(
            { ok: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลจากระบบฐานข้อมูล" },
            { status: 500 }
        );
    }
}
