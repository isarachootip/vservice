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
        const vendorName = getString(formData.get("vendorName"));
        const receiverName = getString(formData.get("receiverName"));
        const receiverTel = getString(formData.get("receiverTel"));
        const sendDate = getString(formData.get("sendDate"));
        const updatedUser = getString(formData.get("updatedUser"));
        const files = formData.getAll("files") as File[];
        
        if (!requestId) {
            return NextResponse.json({ error: "Missing Request Id" }, { status: 400 });
        }

        //* แปลง id จาก string เป็น numb
        const idNum = Number(requestId);
        if (!Number.isFinite(idNum)) {
            return NextResponse.json({ error: "Invalid Request Id" }, { status: 400 });
        }
        //* แปลง Date
        const sendDateDt = sendDate ? new Date(sendDate) : null;

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

        await prisma.repair_request.update({
            where: { id: idNum },
            data: {
                vendor_name: vendorName,
                send_to_vendor_by: receiverName,
                send_to_vendor_tel: receiverTel,
                send_to_vendor_date: sendDateDt,
                status: 31,
                updated_user: updatedUser,
            },
        });

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
                step_no: "31"
            });
        }

        if (attachmentRows.length > 0) {
            await prisma.repair_attachment.createMany({ data: attachmentRows });
        }

        const trans_log_text = "เพิ่มข้อมูล Vendor ที่มารับสินค้า ใบแจ้งซ่อม : " + res.request_no; 
        await prisma.transaction_log.create({
            data: {
                act_user_name: updatedUser,
                act_ip_address: ip,
                act_trans_log: trans_log_text,
                step_no: "31",
                request_id: idNum,
            }
        });

        return NextResponse.json({ ok: true, message: "บันทึกข้อมูลสำเร็จ", requestId: idNum }, { status: 200 });
    } catch (err) {
    console.error("update vendor info error:", err);
        return NextResponse.json(
            { ok: false, message: "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
            { status: 500 }
        );
    }
}
