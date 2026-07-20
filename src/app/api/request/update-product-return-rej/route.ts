import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { buildAttachmentFileName } from "@/lib/utils/file.util";
import { UserService, UserRowWithPermissionsList } from "@/lib/service/users.service";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

type Mode = "DC" | "VEN";

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
        let profile: UserRowWithPermissionsList | null = null;
        const ip = getClientIp(req);
        
        const form = await req.formData();
        const action = form.get("action")?.toString();
        const requestId = form.get("requestId");
        const updatedUser = form.get("updatedUser")?.toString();
        const mode = form.get("mode")?.toString() as Mode | undefined;

        if (!requestId) {
            return NextResponse.json(
                { ok: false, message: "Missing requestId" },
                { status: 400 }
            );
        }

        if (!updatedUser) {
            return NextResponse.json(
                { ok: false, message: "Missing updatedUser" },
                { status: 400 }
            );
        }

        profile = await UserService.getUserProfile(updatedUser);
        if (!profile) {
            return NextResponse.json({ ok: false, message: "ไม่พบข้อมูลผู้ใช้งาน" }, { status: 401 });
        }

        //* แปลง id จาก string เป็น numb
        const idNum = typeof requestId === "string" ? Number(requestId) : Number(requestId);
        const existing = await prisma.repair_request.findUnique({
            where: { id: idNum },
            select: { request_no: true },
        });
        
        if (!existing) {
            return NextResponse.json(
                { ok: false, message: "ไม่พบ request" },
                { status: 404 }
            );
        }

        //* phase DC คืนสินค้ากลับสาขา
        if (action === "ProductRejDcToHO") {
            const receiverName   = form.get("receiverName")?.toString();
            const dcSentName = form.get("dcSentName")?.toString();
            const dcReturnDate = form.get("dcReturnDate")?.toString();
            const dcSentTel = form.get("dcSentTel")?.toString();

            const dcReturnDateDt = dcReturnDate
                ? new Date(dcReturnDate)
                : null;

            const nextStatus = 210; // รอ DC มารับสินค้า (SRS v2.1)

            await prisma.repair_request.update({
                where: { id: idNum },
                data: {
                    dc_rej_return_send_by: dcSentName,
                    dc_rej_return_receive_by: receiverName,
                    dc_rej_return_date: dcReturnDateDt,
                    dc_rej_return_tel: dcSentTel,
                    status: nextStatus,
                    updated_user: updatedUser,
                    updated_date: new Date(),
                    status_updated_date: new Date(),
                },
            });
        }

        //* แนบไฟล์
        const files = form.getAll("attachments") as File[];
        //* Determine step based on action
        let step = "";
        if(action === "ProductRejDcToHO"){
            step = "220"; // DC รับสินค้าจากสาขา (SRS v2.1)
        }

        if (files?.length) {
            const requestNo = existing.request_no || ``;
            const uploadDir = path.join(process.cwd(),"public", "uploads", "repair", requestNo);

            await fs.mkdir(uploadDir, { recursive: true });

            const attachmentRows = [];
            // else if(action === "ProductCustomerReturn" && mode === "VEN"){
            //     step = "37";
            // }else if(action === "ProductVendorToDcReturn"){
            //     step = "2360";
            // }else if(action === "ProductDcReturn"){
            //     step = "236";
            // }else if(action === "ProductCustomerReturn" && mode === "DC"){
            //     step = "237";
            // }

            for (let i = 0; i < files.length; i++) {
                const f = files[i];
                if (!(f instanceof File)) continue;

                const fileName = buildAttachmentFileName(requestNo, "", f.name);
                const absPath = path.join(uploadDir, fileName);

                const bytes = Buffer.from(await f.arrayBuffer());
                await fs.writeFile(absPath, bytes);
                
                const publicPath = `/uploads/repair/${requestNo}/${fileName}`;

                attachmentRows.push({
                    request_id: idNum,
                    file_path: publicPath,
                    file_name: fileName,
                    mime_type: f.type || null,
                    file_size: f.size ?? null,
                    updated_user: updatedUser,
                    step_no: step
                });
            }

            if (attachmentRows.length) {
                    await prisma.repair_attachment.createMany({
                    data: attachmentRows,
                });
            }
        }

        let log_text = "";
        if(action === "ProductRejDcToHO"){
            log_text = "เพิ่มข้อมูลบันทึกการส่งคืนสินค้าจาก DC กรณีตีกลับ ใบแจ้งซ่อม : ";
        }
        // else if(action === "ProductDcReturn"){
        //     log_text = "เพิ่มข้อมูลบันทึกการส่งคืนสินค้าจาก DC ใบแจ้งซ่อม : ";
        // }else if(action === "ProductVendorToDcReturn"){
        //     log_text = "เพิ่มข้อมูลบันทึกการส่งคืนสินค้าจาก Vendor ถึง DC ใบแจ้งซ่อม : ";
        // }else if(action === "ProductVendorToHO"){
        //     log_text = "เพิ่มข้อมูลบันทึกการส่งคืนสินค้าจาก Vendor ถึง สาขา ใบแจ้งซ่อม : ";
        // }else if(action === "ProductVendorToDcInstead"){
        //     log_text = "เพิ่มข้อมูลบันทึกการส่งคืนสินค้าจาก Vendor ถึง DC รับแทนสาขา ใบแจ้งซ่อม : ";
        // }else if(action === "ProductCustomerReturn"){
        //     log_text = "เพิ่มข้อมูลบันทึกการส่งคืนสินค้าให้ลูกค้า ใบแจ้งซ่อม : ";
        // }
        const trans_log_text = log_text + existing.request_no; 
        await prisma.transaction_log.create({
            data: {
                act_user_name: updatedUser,
                act_ip_address: ip,
                act_trans_log: trans_log_text,
                step_no: step,
                request_id: idNum,
            }
        });

        return NextResponse.json({ ok: true, message: "บันทึกข้อมูลสำเร็จ", requestId: idNum }, { status: 200 });
    } catch (err) {
    console.error("update product return error :", err);
        return NextResponse.json(
            { ok: false, message: "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
            { status: 500 }
        );
    }
}
