import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "@/lib/authen";
import { UserService, UserRowWithPermissionsList } from "@/lib/service/users.service";
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

    const customer = JSON.parse(String(formData.get("customer") ?? "{}"));
    const product  = JSON.parse(String(formData.get("product") ?? "{}"));
    const warranty = JSON.parse(String(formData.get("warranty") ?? "{}"));

    const serialFiles = formData.getAll("serialAttachments").filter(Boolean) as File[];
    const picFiles = formData.getAll("picAttachments").filter(Boolean) as File[];
    const internalFlg = String(formData.get("internalFlg") ?? "N");
    const serviceTier = String(formData.get("serviceTier") ?? "NORMAL");
    const diagnosticFee = parseFloat(String(formData.get("diagnosticFee") ?? "0"));
    const payMethod = String(formData.get("payMethod") ?? "CASH");
    const payRefNo = String(formData.get("payRefNo") ?? "");

    if (!serialFiles || serialFiles.length === 0) {
      return NextResponse.json({ ok: false, message: "กรุณาแนบไฟล์" }, { status: 400 });
    }
    if (!picFiles || picFiles.length === 0) {
      return NextResponse.json({ ok: false, message: "กรุณาแนบไฟล์" }, { status: 400 });
    }

    let createdUser = "system";
    let storeCode: string | null = null;
    let profile: UserRowWithPermissionsList | null = null;

    try {
      const store = await cookies();
      const token = store.get(COOKIE_NAME)?.value;
      if (token) {
        const payload = await verifyToken(token);
        createdUser = String(payload.sub || "system");
        //data user
        profile = await UserService.getUserProfile(createdUser);

        const s = (payload as { store?: number | string })?.store;
        if (typeof s === "number") storeCode = String(s);
        else if (typeof s === "string") storeCode = s.trim();
      }
    } catch {}

    if (!profile) {
      return NextResponse.json({ ok: false, message: "ไม่พบข้อมูลผู้ใช้งาน" }, { status: 401 });
    }

    const { firstName, lastName, address, phone, receiveFromUserDtStr } = customer;
    const { productType, brand, model = "", serial = "", qty, skuFlg, sku, barcode, issue = ""} = product;

    const { status, warrantyNo = null } = warranty;

    const prefix = `${profile.in_bu}${profile.store_nick}`;
    const now = new Date();
    const yy = Number(String(now.getFullYear()).slice(-2));
    const mm = now.getMonth() + 1;
    const dd = now.getDate();
    
    const row = await prisma.running_doc.upsert({
      where: { unique_running_doc_by_day: { prefix, yy, mm, dd } },
      create: { prefix, yy, mm, dd, running_no: BigInt(1) },
      update: { running_no: { increment: BigInt(1) } },
    });

    //* helper
    const pad2 = (n: number) => String(n).padStart(2, "0");
    const pad4 = (n: bigint) => n.toString().padStart(4, "0");

    const request_no = `${prefix}${pad2(dd)}${pad2(mm)}${pad2(yy)}${pad4(row.running_no ?? BigInt(1))}`;
    const fullCustomerName = `${firstName} ${lastName}`.trim();
    const inWarrantyFlag = status === "in" ? "Y" : "N"
    const serial_num = (serial ?? "").trim();

    const uploadDir = path.join(process.cwd(), "public", "uploads", "repair", request_no);
    await fs.mkdir(uploadDir, { recursive: true });

    //* แปลง Date
    const newReceiveFromUserDt = receiveFromUserDtStr ? new Date(receiveFromUserDtStr) : null;
    // insert 1:1
    const created = await prisma.repair_request.create({
      data: {
        request_no: request_no,
        customer_name: fullCustomerName,
        address,
        phone,
        store_code: storeCode,
        location_id: profile?.location_id || null,
        receive_from_user_date: newReceiveFromUserDt,
        status : 10 ,
        internal_flg: internalFlg,
        service_tier: serviceTier,
        diagnostic_fee: diagnosticFee,
        created_user: createdUser,
        updated_user: createdUser,
        repair_item: {
          create: [
            {
              product_type: productType,
              brand,
              model,
              serial_no: serial_num,                      
              qty,
              in_warranty: inWarrantyFlag,            
              warranty_no: inWarrantyFlag === "Y" ? (warrantyNo || null) : null,
              issue,
              created_user: createdUser,
              updated_user: createdUser,
              bar_code: barcode,
              sku_flg: skuFlg,
              sku_code: sku,
            },
          ],
        },
      },
      include: { repair_item: true }, 
    });

    const trans_log_text = "เปิดใบแจ้งซ่อม : " + request_no;
    await prisma.transaction_log.create({
      data: {
        act_user_name: createdUser,
        act_ip_address: ip,
        act_trans_log: trans_log_text,
        step_no: "100",
        request_id: created.id,
      }
    });

    if (diagnosticFee > 0) {
      const pPrefix = `${profile?.in_bu || "TW"}P${profile?.store_nick || ""}`;
      const pRow = await prisma.running_doc.upsert({
        where: { unique_running_doc_by_day: { prefix: pPrefix, yy, mm, dd } },
        create: { prefix: pPrefix, yy, mm, dd, running_no: BigInt(1) },
        update: { running_no: { increment: BigInt(1) } },
      });
      const receipt_no = `${pPrefix}${pad2(dd)}${pad2(mm)}${pad2(yy)}${pad4(pRow.running_no ?? BigInt(1))}`;

      await prisma.payment_transaction.create({
        data: {
          request_id: created.id,
          payment_type: "DIAGNOSTIC_FEE",
          amount: diagnosticFee,
          method: payMethod,
          ref_no: payRefNo || null,
          receipt_no: receipt_no,
          received_by: createdUser,
          status: "CONFIRMED"
        }
      });
    }

    const attachmentRows: Array<{
      request_id: number;
      file_path: string;
      file_name: string;
      mime_type?: string | null;
      file_size?: number | null;
      step_no: string;
    }> = [];

    for (let i = 0; i < serialFiles.length; i++) {
      const f = serialFiles[i];
      if (!(f instanceof File)) continue;

      const fileName = buildAttachmentFileName(request_no, "SERIAL", f.name); 
      const absPath = path.join(uploadDir, fileName);

      const bytes = Buffer.from(await f.arrayBuffer());
      await fs.writeFile(absPath, bytes);

      attachmentRows.push({
        request_id: created.id,
        file_path: `/uploads/repair/${request_no}/${fileName}`,
        file_name: fileName,
        mime_type: f.type || null,
        file_size: f.size ?? null,
        step_no: "100", 
      });
    }

    for (let i = 0; i < picFiles.length; i++) {
      const f = picFiles[i];
      if (!(f instanceof File)) continue;

      const fileName = buildAttachmentFileName(request_no, "", f.name); 
      const absPath = path.join(uploadDir, fileName);

      const bytes = Buffer.from(await f.arrayBuffer());
      await fs.writeFile(absPath, bytes);

      attachmentRows.push({
        request_id: created.id,
        file_path: `/uploads/repair/${request_no}/${fileName}`,
        file_name: fileName,
        mime_type: f.type || null,
        file_size: f.size ?? null,
        step_no: "100", 
      });
    }

    // for (let i = 0; i < files.length; i++) {
    //   const f = files[i];
    //   if (!(f instanceof File)) continue;
    //   const fileName = buildAttachmentFileName(request_no, "", f.name);
    //   const absPath = path.join(uploadDir, fileName);
    //   const bytes = Buffer.from(await f.arrayBuffer());
    //   await fs.writeFile(absPath, bytes);
    //   const publicPath = `/uploads/repair/${request_no}/${fileName}`;

    //   attachmentRows.push({
    //     request_id: created.id,
    //     file_path: publicPath,
    //     file_name: fileName,      
    //     mime_type: f.type || null,
    //     file_size: f.size ?? null,
    //     step_no: "10"
    //   });
    // }

    if (attachmentRows.length > 0) {
      await prisma.repair_attachment.createMany({ data: attachmentRows });
    }

    return NextResponse.json(
      {
        ok: true,
        id: created.id,
        requestNo: created.request_no ?? null,
        itemId: created.repair_item[0]?.id?? null,
        attachments: attachmentRows.length,
      },
      { status: 201 }
    );
    
  } catch (err) {
    console.error("create request error:", err);
    return NextResponse.json(
      { ok: false, message: "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
