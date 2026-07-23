import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { promises as fs } from "fs";
import path from "path";
import { buildAttachmentFileName } from "@/lib/utils/file.util";

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
  return "unknown";
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const contentType = req.headers.get("content-type") || "";

    let id: string | number | undefined;
    let status: number | undefined;
    let updatedUser: string | undefined;
    let newSerial: string | undefined;
    let serialMismatchReason: string | undefined;
    let files: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const getString = (value: FormDataEntryValue | null) => typeof value === "string" ? value : "";
      id = getString(formData.get("Id"));
      status = Number(getString(formData.get("status")));
      updatedUser = getString(formData.get("updatedUser"));
      newSerial = getString(formData.get("newSerial"));
      serialMismatchReason = getString(formData.get("serialMismatchReason"));
      files = formData.getAll("files") as File[];
    } else {
      const body = await req.json().catch(() => ({}));
      id = body.Id;
      status = body.status;
      updatedUser = body.updatedUser;
      newSerial = body.newSerial;
      serialMismatchReason = body.serialMismatchReason;
    }

    if (id == null) {
      return NextResponse.json({ ok: false, message: "ID is NULL" }, { status: 400 });
    }

    const idNum = typeof id === "string" ? Number(id) : id;
    if (!Number.isFinite(idNum)) {
      return NextResponse.json({ ok: false, message: "ID ต้องเป็นตัวเลข" }, { status: 400 });
    }

    const res = await prisma.repair_request.findUnique({
      where: { id: idNum },
      include: {
        repair_item: true
      }
    });

    if (!res) {
      return NextResponse.json({ ok: false, message: "ไม่พบข้อมูลใบแจ้งซ่อม" }, { status: 404 });
    }

    let serialLogText = "";
    // Verify serial number if supplied
    if (newSerial !== undefined && newSerial !== "") {
      const currentItem = res.repair_item[0];
      if (currentItem) {
        const cleanOld = (currentItem.serial_no || "").trim().toLowerCase();
        const cleanNew = (newSerial || "").trim().toLowerCase();
        if (cleanOld !== cleanNew) {
          if (!serialMismatchReason || !serialMismatchReason.trim()) {
            return NextResponse.json({
              ok: false,
              message: "กรุณาระบุเหตุผลกรณีเลขเครื่องไม่ตรงกัน (Serial Mismatch Reason Required)"
            }, { status: 400 });
          }

          // Update serial
          await prisma.repair_item.update({
            where: { id: currentItem.id },
            data: {
              serial_no: newSerial,
              updated_user: updatedUser
            }
          });

          serialLogText = ` | แก้ไขเลขเครื่องจาก ${currentItem.serial_no} เป็น ${newSerial} (เหตุผล: ${serialMismatchReason})`;
        }
      }
    }

    if(res.reject_flg === "Y"){
      await prisma.repair_request.update({
        where: { id: idNum },
        data: {
          reject_flg: "N",
          status: status,
          updated_user: updatedUser,
          updated_date: new Date(),
          status_updated_date: new Date(),
        },
      });
    }else{
      await prisma.repair_request.update({
        where: { id: idNum },
        data: {
          status: status,
          updated_user: updatedUser,
          updated_date: new Date(),
          status_updated_date: new Date(),
        },
      });
    }

    // Save attachments if any
    if (files.length > 0) {
      const requestNo = res.request_no ?? "";
      const uploadDir = path.join(process.cwd(), "public", "uploads", "repair", requestNo);
      await fs.mkdir(uploadDir, { recursive: true });

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
          step_no: String(status)
        });
      }

      if (attachmentRows.length > 0) {
        await prisma.repair_attachment.createMany({ data: attachmentRows });
      }
    }

    let choice: string = "";
    if(status == 200){
      choice = "DC"
    }else if(status == 300){
      choice = "Vendor"
    }
    const trans_log_text = "ปรับสถานะใบแจ้งซ่อม : " + res.request_no + " จัดส่งให้ " + choice + serialLogText;
    await prisma.transaction_log.create({
      data: {
        act_user_name: updatedUser,
        act_ip_address: ip,
        act_trans_log: trans_log_text,
        step_no: String(status),
        request_id: idNum,
      }
    });

    return NextResponse.json({ ok: true, message: "อัปเดตข้อมูลสำเร็จ", requestId: idNum }, { status: 200 });
  } catch (err) {
    console.error("update request error:", err);
    return NextResponse.json(
      { ok: false, message: "อัปเดตไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
