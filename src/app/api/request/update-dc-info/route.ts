import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { promises as fs } from "fs";
import { buildAttachmentFileName } from "@/lib/utils/file.util";
import path from "path";

export const runtime = "nodejs";

function getClientIp(req: Request): string {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }
    const realIp = req.headers.get("x-real-ip");
    if (realIp) {
        return realIp.trim();
    }
    const cfConnectingIp = req.headers.get("cf-connecting-ip");
    if (cfConnectingIp) {
        return cfConnectingIp.trim();
    }
    return "unknown";
}

export async function POST(req: Request) {
    try {
        const ip = getClientIp(req);
        const formData = await req.formData();
        const getString = (value: FormDataEntryValue | null) => typeof value === "string" ? value : "";

        const requestId = getString(formData.get("requestId"));
        const dcReceiver = getString(formData.get("dcReceiver"));
        const dcReceiveDate = getString(formData.get("dcReceiveDate"));
        const receiverTel = getString(formData.get("receiverTel"));
        // const approvelogID = getString(formData.get("approvelogID"));

        const dcArriveDate = getString(formData.get("dcArriveDate"));

        const updatedUser = getString(formData.get("updatedUser"));
        const status = getString(formData.get("status"));
        const files = formData.getAll("files") as File[];

        if (!requestId) {
            return NextResponse.json({ error: "Missing request_Id" }, { status: 400 });
        }

        //* แปลง id จาก string เป็น numb
        const idNum = typeof requestId === "string" ? Number(requestId) : requestId;
        const statusNum = Number(status);
        if (!Number.isFinite(statusNum)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const receiveDt = dcReceiveDate ? new Date(dcReceiveDate) : null;
        const arriveDt = dcArriveDate ? new Date(dcArriveDate) : null;

        if(statusNum === 210){
            await prisma.repair_request.update({
            where: { id: idNum },
                data: {
                    dc_receiver_name: dcReceiver,
                    dc_receive_date: receiveDt,
                    dc_receiver_tel: receiverTel,
                    status: 220,
                    updated_user: updatedUser,
                    reject_flg: null,
                    reject_from_status: null,
                },
            });
        }else if(statusNum === 220){
            await prisma.repair_request.update({
            where: { id: idNum },
                data: {
                    arrive_to_dc_date: arriveDt,
                    status: 230,
                    updated_user: updatedUser,
                    reject_flg: null,
                    reject_from_status: null,
                },
            });
        }

        const res = await prisma.repair_request.findUnique({
            where: { id: idNum },
            select: {
                id: true,
                request_no: true,
            },
        });
        
        if (!res) {
            return NextResponse.json({ ok: false, message: "ไม่พบข้อมูลใบแจ้งซ่อม" }, { status: 404 });
        }

        const requestNo = res.request_no ?? ""
        const uploadDir = path.join(process.cwd(), "public", "uploads", "repair", requestNo);
        await fs.mkdir(uploadDir, { recursive: true });

        //* save file แนบ
        const attachmentRows: Array<{
            request_id: number;
            file_path: string;
            file_name: string;
            mime_type?: string | null;
            file_size?: number | null;
            step_no: string;
        }> = [];
        
        //* condition stamp step file แนบ
        let step = "";
        if(statusNum === 210){
            step = "220";
        }else if(statusNum === 220){
            step = "220"; // keep step as 220
        }

        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            if (!(f instanceof File)) continue;
                
            const fileName = buildAttachmentFileName(requestNo, "", f.name);
            const absPath = path.join(uploadDir, fileName);
                
            const bytes = Buffer.from(await f.arrayBuffer());
            await fs.writeFile(absPath, bytes);
                
            const publicPath = `/uploads/repair/${requestNo}/${fileName}`;
                
            attachmentRows.push({
                request_id: res.id,
                file_path: publicPath,
                file_name: fileName,      
                mime_type: f.type || null,
                file_size: f.size ?? null,
                step_no: step
            });
        }
        
        if (attachmentRows.length > 0) {
            await prisma.repair_attachment.createMany({ data: attachmentRows });
        }
        
        if(statusNum === 210){
            const trans_log_text = "เพิ่มข้อมูลบันทึกการรับสินค้าของ DC : " + requestNo; 
            await prisma.transaction_log.create({
                data: {
                    act_user_name: updatedUser,
                    act_ip_address: ip,
                    act_trans_log: trans_log_text,
                    step_no: String(statusNum),
                    request_id: idNum,
                }
            });
        }else if(statusNum === 220){
            const trans_log_text = "เพิ่มข้อมูลวันที่ DC รับสินค้าเข้าที่ DC : " + requestNo; 
            await prisma.transaction_log.create({
                data: {
                    act_user_name: updatedUser,
                    act_ip_address: ip,
                    act_trans_log: trans_log_text,
                    step_no: String(statusNum),
                    request_id: idNum,
                }
            });
        }

        return NextResponse.json({ ok: true, message: "บันทึกข้อมูลสำเร็จ", requestId: idNum }, { status: 200 });
    } catch (err) {
    console.error("update dc info error:", err);
        return NextResponse.json(
            { ok: false, message: "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
            { status: 500 }
        );
    }
}
