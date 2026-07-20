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

        //* phase รับคืนสินค้าจาก vendor มา dc
        if (action === "ProductVendorToDcReturn") {
            const receiverName   = form.get("receiverName")?.toString();
            const vendorSentName = form.get("vendorSentName")?.toString();
            const vendorReturnDate = form.get("vendorReturnDate")?.toString();
            const vendorSentTel = form.get("vendorSentTel")?.toString();

            const vendorReturnDateDt = vendorReturnDate
                ? new Date(vendorReturnDate)
                : null;

            const nextStatus = 280; // DC รับสินค้าคืนจาก Vendor (SRS v2.1)

            await prisma.repair_request.update({
                where: { id: idNum },
                data: {
                    vendor_send_to_dc_by: vendorSentName,
                    vendor_to_dc_receive_by: receiverName,
                    vendor_send_to_dc_date: vendorReturnDateDt,
                    vendor_to_dc_tel: vendorSentTel,
                    status: nextStatus,
                    updated_user: updatedUser,
                    updated_date: new Date(),
                    status_updated_date: new Date(),
                },
            });
        }

        //* phase gr รับคืนสินค้าจาก vendor แทน dc
        if (action === "ProductVendorToHO") {
            const receiverName   = form.get("receiverName")?.toString();
            const vendorSentName = form.get("vendorSentName")?.toString();
            const vendorReturnDate = form.get("vendorReturnDate")?.toString();
            const vendorSentTel = form.get("vendorSentTel")?.toString();

            const vendorReturnDateDt = vendorReturnDate
                ? new Date(vendorReturnDate)
                : null;

            const nextStatus = 290; // CS รับสินค้าคืนแล้ว / รอลูกค้ารับ (DC Path → GR direct to HO)

            await prisma.repair_request.update({
                where: { id: idNum },
                data: {
                    vendor_send_to_dc_by: vendorSentName,
                    vendor_to_dc_receive_by: receiverName,
                    vendor_send_to_dc_date: vendorReturnDateDt,
                    vendor_to_dc_tel: vendorSentTel,
                    status: nextStatus,
                    updated_user: updatedUser,
                    updated_date: new Date(),
                    status_updated_date: new Date(),
                },
            });
        }

        //* phase (vandor path) เมื่อ vendor ส่งคืนสินค้าให้กับ DC แทน สาขา
        if (action === "ProductVendorToDcInstead") {
            const receiverName   = form.get("receiverName")?.toString();
            const vendorSentName = form.get("vendorSentName")?.toString();
            const vendorReturnDate = form.get("vendorReturnDate")?.toString();
            const vendorSentTel = form.get("vendorSentTel")?.toString();

            const vendorReturnDateDt = vendorReturnDate
                ? new Date(vendorReturnDate)
                : null;

            const nextStatus = 350; // Vendor คืนผ่าน DC แทนสาขา (DC รอส่งเข้าสาขา)

            await prisma.repair_request.update({
                where: { id: idNum },
                data: {
                    vendor_send_to_dc_by: vendorSentName,
                    vendor_to_dc_receive_by: receiverName,
                    vendor_send_to_dc_date: vendorReturnDateDt,
                    vendor_to_dc_tel: vendorSentTel,
                    status: nextStatus,
                    updated_user: updatedUser,
                    updated_date: new Date(),
                    status_updated_date: new Date(),
                },
            });
        }

        //* phase รับคืนสินค้าจาก dc มา สาขา
        if (action === "ProductDcReturn") {
            const receiverName   = form.get("receiverName")?.toString();
            const dcSentName = form.get("dcSentName")?.toString();
            const dcReturnDate = form.get("dcReturnDate")?.toString();
            const dcSentTel = form.get("dcSentTel")?.toString();

            const dcReturnDateDt = dcReturnDate
                ? new Date(dcReturnDate)
                : null;

            const nextStatus = mode === "DC" ? 285 : 360; // GR รับสินค้าคืนจาก DC/Vendor
            // const nextStatus = 290;

            await prisma.repair_request.update({
                where: { id: idNum },
                data: {
                    dc_return_send_by: dcSentName,
                    dc_return_receive_by: receiverName,
                    dc_return_date: dcReturnDateDt,
                    dc_return_tel: dcSentTel,
                    status: nextStatus,
                    updated_user: updatedUser,
                    updated_date: new Date(),
                    status_updated_date: new Date(),
                },
            });
        }

        //* phase สาขา รับคืนสินค้าจาก vendor
        if (action === "ProductVendorReturn") {
            const receiverName   = form.get("receiverName")?.toString();
            const vendorSentName = form.get("vendorSentName")?.toString();
            const vendorReturnDate = form.get("vendorReturnDate")?.toString();
            const vendorSentTel = form.get("vendorSentTel")?.toString();

            const vendorReturnDateDt = vendorReturnDate
                ? new Date(vendorReturnDate)
                : null;

            const nextStatus = mode === "DC" ? 290 : 360; // DC→290, Vendor→360

            await prisma.repair_request.update({
                where: { id: idNum },
                data: {
                    vendor_return_receive_by: receiverName,
                    vendor_return_sent_by: vendorSentName,
                    vendor_return_date: vendorReturnDateDt,
                    vendor_return_sender_tel: vendorSentTel,
                    status: nextStatus,
                    updated_user: updatedUser,
                    updated_date: new Date(),
                    status_updated_date: new Date(),
                },
            });
        }

        //* phase GR คืนสินค้าให้ CS
        if (action === "ProductGrReturnToCs") {
            const receiverName   = form.get("receiverName")?.toString();
            const grSentName = form.get("grSentName")?.toString();
            const grReturnDate = form.get("grReturnDate")?.toString();
            const grSentTel = form.get("grSentTel")?.toString();
            const location = form.get("location")?.toString();

            const grReturnDateDt = grReturnDate
                ? new Date(grReturnDate)
                : null;

            const nextStatus = mode === "DC" ? 290 : 390; // GR คืนสินค้าให้ CS: DC→290, Vendor→390

            await prisma.repair_request.update({
                where: { id: idNum },
                data: {
                    gr_send_return_to_cs_receive_by: receiverName,
                    gr_send_return_to_cs_by: grSentName,
                    gr_send_return_to_cs_date: grReturnDateDt,
                    gr_send_return_to_cs_tel: grSentTel,
                    location: location,
                    status: nextStatus,
                    updated_user: updatedUser,
                    updated_date: new Date(),
                    status_updated_date: new Date(),
                },
            });

            // Trigger customer notification for ready for return
            try {
              const { NotificationService } = await import("@/lib/service/notification.service");
              await NotificationService.sendNotification(idNum, "READY_RETURN");
            } catch (e) {
              console.error("⚠️ Failed to trigger return notification:", e);
            }
        }

        //* phase คืนสินค้าให้ลูกค้า
        if (action === "ProductCustomerReturn") {
            const quotations = await prisma.quotation.findMany({
                where: { request_id: idNum }
            });
            const totalQuotationNetPrice = quotations.reduce((sum, q) => sum + (q.net_price ? parseFloat(q.net_price.toString()) : 0), 0);

            const payments = await prisma.payment_transaction.findMany({
                where: { request_id: idNum }
            });
            const repairPaymentsPaid = payments
                .filter(p => p.payment_type !== "DIAGNOSTIC_FEE")
                .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

            const outstandingBalance = totalQuotationNetPrice - repairPaymentsPaid;
            if (outstandingBalance > 0.01) {
                return NextResponse.json(
                    { ok: false, message: `ไม่สามารถส่งมอบสินค้าคืนได้เนื่องจากยังมียอดค้างชำระ: ${outstandingBalance.toFixed(2)} บาท` },
                    { status: 400 }
                );
            }

            const sentName = form.get("sentName")?.toString();
            const customerName = form.get("customerName")?.toString();
            const sentProductReturnDate =
                form.get("sentProductReturnDate")?.toString();

            const sentProductReturnDateDt = sentProductReturnDate
                ? new Date(sentProductReturnDate)
                : null;
            const signatureBase64 = form.get("signatureSign")?.toString();

            const nextStatus = mode === "DC" ? 299 : 399; // ลูกค้ารับสินค้าแล้ว (ปิดงาน)

            const prefix = `${profile.in_bu}R${profile.store_nick}`;
            const now = new Date();
            const yy = Number(String(now.getFullYear()).slice(-2));
            const mm = now.getMonth() + 1;
            const dd = now.getDate();

            const row = await prisma.running_doc.upsert({
                where: { unique_running_doc_by_day: { prefix, yy, mm, dd } },
                create: { prefix, yy, mm, dd, running_no: BigInt(1) },
                update: { running_no: { increment: BigInt(1) } },
            });

            //* prefix helper
            const pad2 = (n: number) => String(n).padStart(2, "0");
            const pad4 = (n: bigint) => n.toString().padStart(4, "0");

            const request_return_no = `${prefix}${pad2(dd)}${pad2(mm)}${pad2(yy)}${pad4(row.running_no ?? BigInt(1))}`;

            await prisma.repair_request.update({
                where: { id: idNum },
                data: {
                    customer_receive_by: customerName,
                    customer_receive_sent_by: sentName,
                    customer_receive_date: sentProductReturnDateDt,
                    status: nextStatus,
                    updated_user: updatedUser,
                    updated_date: new Date(),
                    status_updated_date: new Date(),
                    request_return_no: request_return_no
                },
            });

            if (signatureBase64) {
                const requestNo = existing.request_no || ``;
                const uploadDir = path.join(process.cwd(),"public", "uploads", "repair", requestNo);

                await fs.mkdir(uploadDir, { recursive: true });

                const base64Data = signatureBase64.split(",")[1];

                if (base64Data) {
                    const buffer = Buffer.from(base64Data, "base64");

                    const fileName = `signature_${Date.now()}.jpg`;
                    const filePath = path.join(uploadDir, fileName);
                    await fs.writeFile(filePath, buffer);

                    const publicPath = `/uploads/repair/${requestNo}/${fileName}`;
                    const signatureStep = mode === "DC" ? "299" : "399";

                    await prisma.repair_attachment.create({
                        data: {
                            request_id: idNum,
                            file_path: publicPath,
                            file_name: fileName,
                            mime_type: "image/jpeg",
                            file_size: buffer.length,
                            updated_user: updatedUser,
                            step_no: signatureStep
                        }
                    });
                }
            }
        }

        //* แนบไฟล์
        const files = form.getAll("attachments") as File[];
        if (files?.length) {
            const requestNo = existing.request_no || ``;
            const uploadDir = path.join(process.cwd(),"public", "uploads", "repair", requestNo);

            await fs.mkdir(uploadDir, { recursive: true });

            const attachmentRows = [];

            //* condition stamp step file แนบ
            let step = "";
            if(action === "ProductVendorReturn"){
                step = "360";
            }else if(action === "ProductGrReturnToCs" && mode === "VEN"){
                step = "390";
            }else if(action === "ProductCustomerReturn" && mode === "VEN"){
                step = "399";
            }else if(action === "ProductVendorToDcReturn"){
                step = "280";
            }else if(action === "ProductDcReturn"){
                step = "285";
             }else if(action === "ProductGrReturnToCs" && mode === "DC"){
                step = "290";
            }else if(action === "ProductCustomerReturn" && mode === "DC"){
                step = "299";
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
        let stepNo = "";
        if(action === "ProductVendorReturn"){
            log_text = "เพิ่มข้อมูลบันทึกการส่งคืนสินค้าจาก Vendor ใบแจ้งซ่อม : ";
            stepNo = "360";
        }else if(action === "ProductDcReturn"){
            log_text = "เพิ่มข้อมูลบันทึกการส่งคืนสินค้าจาก DC ใบแจ้งซ่อม : ";
            stepNo = "285";
        }else if(action === "ProductVendorToDcReturn"){
            log_text = "เพิ่มข้อมูลบันทึกการส่งคืนสินค้าจาก Vendor ถึง DC ใบแจ้งซ่อม : ";
            stepNo = "280";
        }else if(action === "ProductVendorToHO"){
            log_text = "เพิ่มข้อมูลบันทึกการส่งคืนสินค้าจาก Vendor ถึง สาขา ใบแจ้งซ่อม : ";
            stepNo = "360";
        }else if(action === "ProductVendorToDcInstead"){
            log_text = "เพิ่มข้อมูลบันทึกการส่งคืนสินค้าจาก Vendor ถึง DC รับแทนสาขา ใบแจ้งซ่อม : ";
            stepNo = "350";
        }else if(action === "ProductCustomerReturn"){
            log_text = "เพิ่มข้อมูลบันทึกการส่งคืนสินค้าให้ลูกค้า ใบแจ้งซ่อม : ";
            stepNo = mode === "VEN" ? "399" : "299";
        }
        const trans_log_text = log_text + existing.request_no;
        await prisma.transaction_log.create({
            data: {
                act_user_name: updatedUser,
                act_ip_address: ip,
                act_trans_log: trans_log_text,
                step_no: stepNo,
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
