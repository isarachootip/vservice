import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { buildAttachmentFileName } from "@/lib/utils/file.util";
import { promises as fs } from "fs";
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

        const requestIdsRaw = formData.get("requestIds");
        const receiverName = String(formData.get("receiverName") ?? "");
        const vendorSentName = String(formData.get("vendorSentName") ?? "");
        const vendorReturnDateStr = String(formData.get("vendorReturnDate") ?? "");
        const vendorSentTel = String(formData.get("vendorSentTel") ?? "");
        const updatedUser = String(formData.get("updatedUser") ?? "");
        const action = String(formData.get("action") ?? "");
        const mode = String(formData.get("mode") ?? "");

        const files = formData.getAll("attachments") as File[];

        if (!requestIdsRaw) {
            return NextResponse.json(
                { ok: false, message: "ไม่มีรายการ" },
                { status: 400 }
            );
        }

        const requestIds: number[] = JSON.parse(String(requestIdsRaw));

        if (requestIds.length === 0) {
            return NextResponse.json(
                { ok: false, message: "ไม่มีรายการที่เลือก" },
                { status: 400 }
            );
        }

        const vendorReturnDate = vendorReturnDateStr
            ? new Date(vendorReturnDateStr)
            : null;

        let step = "";
        if (action === "ProductVendorReturn") {
            step = "360";
        } else if (action === "ProductCustomerReturn" && mode === "VEN") {
            step = "399";
        } else if (action === "ProductVendorToDcReturn") {
            step = "280";
        } else if (action === "ProductDcReturn") {
            step = "285";
        } else if (action === "ProductCustomerReturn" && mode === "DC") {
            step = "299";
        }

        let log_text = "";
        if(action === "ProductVendorReturn"){
            // log_text = "เพิ่มข้อมูลบันทึกการส่งคืนสินค้าจาก Vendor ใบแจ้งซ่อม : ";
        }else if(action === "ProductDcReturn"){
            // log_text = "เพิ่มข้อมูลบันทึกการส่งคืนสินค้าจาก DC ใบแจ้งซ่อม : ";
        }else if(action === "ProductVendorToDcReturn"){
            log_text = "บันทึกข้อมูลร่วมการส่งคืนสินค้าจาก Vendor ถึง DC ใบแจ้งซ่อม : ";
        }else if(action === "ProductVendorToHO"){
            // log_text = "เพิ่มข้อมูลบันทึกการส่งคืนสินค้าจาก Vendor ถึง สาขา ใบแจ้งซ่อม : ";
        }else if(action === "ProductVendorToDcInstead"){
            // log_text = "เพิ่มข้อมูลบันทึกการส่งคืนสินค้าจาก Vendor ถึง DC รับแทนสาขา ใบแจ้งซ่อม : ";
        }else if(action === "ProductCustomerReturn"){
            // log_text = "เพิ่มข้อมูลบันทึกการส่งคืนสินค้าให้ลูกค้า ใบแจ้งซ่อม : ";
        }

        if (action === "ProductVendorToDcReturn") {
            const nextStatus = 280; // DC รับสินค้าคืนจาก Vendor (SRS v2.1)
            await prisma.$transaction(async (tx) => {
                await tx.repair_request.updateMany({
                    where: { id: { in: requestIds } },
                    data: {
                        vendor_return_receive_by: receiverName,
                        vendor_return_sent_by: vendorSentName,
                        vendor_return_date: vendorReturnDate,
                        vendor_return_sender_tel: vendorSentTel,
                        status: nextStatus,
                        updated_user: updatedUser,
                        updated_date: new Date(),
                        status_updated_date: new Date(),
                    },
                });

                const requests = await tx.repair_request.findMany({
                    where: { id: { in: requestIds } },
                    select: {
                        id: true,
                        request_no: true,
                    },
                });

                if (!requests.length) return;
                const attachmentRows = [];
                for (const reqItem of requests) {
                    const requestNo = reqItem.request_no;
                    if (!requestNo) continue;
                    
                    const uploadDir = path.join(
                        process.cwd(),
                        "public",
                        "uploads",
                        "repair",
                        requestNo
                    );

                    await fs.mkdir(uploadDir, { recursive: true });

                    for (const f of files) {
                        if (!(f instanceof File)) continue;

                        const fileName = buildAttachmentFileName(
                            requestNo,
                            "",
                            f.name
                        );

                        const absPath = path.join(uploadDir, fileName);
                        const bytes = Buffer.from(await f.arrayBuffer());
                        await fs.writeFile(absPath, bytes);

                        const publicPath = `/uploads/repair/${requestNo}/${fileName}`;

                        attachmentRows.push({
                            request_id: reqItem.id,
                            file_path: publicPath,
                            file_name: fileName,
                            mime_type: f.type || null,
                            file_size: f.size ?? null,
                            updated_user: updatedUser,
                            step_no: step,
                        });
                    }
                }

                if (attachmentRows.length > 0) {
                    await tx.repair_attachment.createMany({
                        data: attachmentRows,
                    });
                }
                //* bundle mas
                const bundle = await tx.repair_bundle_master.create({
                    data: {
                        step_no: step,
                        action,
                        created_user: updatedUser,
                    },
                });
                //* bundle ลูก
                await tx.repair_bundle_items.createMany({
                    data: requests.map((r) => ({
                        bundle_master_id: bundle.id,
                        request_id: r.id,
                        request_no: r.request_no ?? "",
                        created_user: updatedUser,
                    })),
                });
                
                if (log_text) {
                    await tx.transaction_log.createMany({
                        data: requests.map((r) => ({
                            act_user_name: updatedUser,
                            act_ip_address: ip,
                            act_trans_log: `[BUNDLE:${bundle.id}] ${log_text}${r.request_no}`,
                            step_no: step,
                            request_id: r.id,
                        })),
                    });
                }
            });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("multi update error:", err);
        return NextResponse.json(
            { ok: false, message: "multi update failed" },
            { status: 500 }
        );
    }
}
