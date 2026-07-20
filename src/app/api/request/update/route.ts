import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { Prisma } from "@prisma/client";
import { getPhaseFromStatus } from "@/lib/statusphase";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

function formatAddressDetail(detail: string): string {
  if (!detail) return "";
  const trimmed = detail.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const p = JSON.parse(trimmed);
      const parts = [];
      if (p.number) parts.push(p.number);
      if (p.soi) parts.push(`ซ.${p.soi}`);
      if (p.road) parts.push(`ถ.${p.road}`);
      if (p.subdistrict) parts.push(`ต./แขวง ${p.subdistrict}`);
      if (p.district) parts.push(`อ./เขต ${p.district}`);
      if (p.province) parts.push(`จ.${p.province}`);
      if (p.zipcode) parts.push(p.zipcode);
      return parts.join(" ");
    } catch {
      return detail;
    }
  }
  return detail;
}

type QuotationItem = {
  quotationId?: number | string | null;
  quotation_no?: string;  
  review_price_date?: string;   
  num_of_repair_day?: string;
  num_of_guarantee_day?: string;              
  repair_order?: string | null;

  part_cost?: number | string | null;
  part_warranty_flg?: "Y" | "N" | null;
  labor_cost?: number | string | null;
  labor_warranty_flg?: "Y" | "N" | null;
  total_part_cost?: number | string | null;
  total_labor_cost?: number | string | null;
  total_cost?: number | string | null;

  user_approve_date?: string | null;
  user_approve_flg?: "Y" | "N" | null;
  ticket_no?: string | null;
};

type Body = {
  requestId?: number | string;
  customer?: {
    firstName?: string;
    lastName?: string;
    address?: string;
    phone?: string;
    receiveFromUserDt?: string;
  };
  product?: {
    productType?: string;
    brand?: string;
    model?: string;
    serial?: string;
    issue?: string;
    qty?: number;
    barcode?: string;
    sku?: number;
    skuFlg?: string;
  };
  warranty?: {
    status?: "in" | "out";
    warrantyNo?: string;
  };
  senderName?: string;
  grOpenLogBy?: string;
  grOpenLogDate?: string;
  vendorName?: string;
  receiverName?: string;
  receiverTel?: string;
  sendDate?: string;
  userApproveFlg?: "Y" | "N" | null;
  userApproveDate?: string;
  ticketNo?: string;
  grSentName?: string;
  csReceiverName?: string;
  grReturnDate?: string;
  grSentTel?: string;
  location?: string;
  sentToDCName: string;
  notifierName: string;
  notifieDate: string;
  vendorReceiveName: string;
  vendorSentName: string;
  vendorSenderTel: string;
  vendorReturnDate: string;
  customerName: string;
  sentName: string;
  sentProductReturnDate: string;
  approvelogID: string;
  dcReceiveDate: string;
  dcReceiverTel: string;
  dcArriveDate: string;
  dcSentName?: string;
  hoReceiverName?: string;
  dcReturnDate?: string;
  dcSentTel?: string;
  status?: number;
  updatedUser?: string;
  quotationItems?: QuotationItem[];
};

function toNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) {
    return Number(v);
  }
  return null;
}

function parseDate(v: unknown): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Date) {
    return Number.isNaN(v.getTime()) ? undefined : v;
  }
  const s = String(v).trim();
  if (!s) return undefined;

  const normalized = s.includes(" ") ? s.replace(" ", "T") : s;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function parseDeletedIds(raw: FormDataEntryValue | null): number[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v) => Number(v))
      .filter((v) => Number.isInteger(v) && v > 0);
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const dataRaw = formData.get("data");
    if (!dataRaw || typeof dataRaw !== "string") {
      return NextResponse.json(
        { ok: false, message: "data ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const body = JSON.parse(dataRaw) as Body;
    //* รับไฟล์ใหม่
    const files = formData.getAll("attachments") as File[];
    const steps = formData
      .getAll("steps")
      .map((v) => (typeof v === "string" ? v : ""))
      .filter(Boolean);

    const deletedAttachmentIds = parseDeletedIds(
      formData.get("deletedAttachmentIds")
    );

    const idNum = toNum(body.requestId);
    if (idNum == null) {
      return NextResponse.json({ ok: false, message: "ต้องระบุ ID" }, { status: 400 });
    }

    const updatedUser = body.updatedUser?.trim() ?? "system";

    const existing = await prisma.repair_request.findUnique({
      where: { id: idNum },
      include: {
        repair_item: true
      }
    })

    if (!existing) {
      return NextResponse.json(
        { ok: false, message: "ไม่พบข้อมูลใบแจ้งซ่อม" },
        { status: 404 },
      );
    }

    const status = body.status ?? existing.status;
    const phase = getPhaseFromStatus(status);

    if(!phase){
      return NextResponse.json(
        { ok: false, message: "สถานะไม่ถูกต้อง" },
        { status: 400},
      );
    }

    const fullCustomerName =
      body.customer && (body.customer.firstName || body.customer.lastName)
        ? `${body.customer.firstName ?? ""} ${
            body.customer.lastName ?? ""
          }`.trim()
        : existing.customer_name;

    await prisma.$transaction(async (tx) => {
      const requestBaseUpdate: Prisma.repair_requestUpdateInput = {
        customer_name: fullCustomerName,
        address: formatAddressDetail(body.customer?.address ?? existing.address),
        phone: body.customer?.phone ?? existing.phone,
        updated_user: updatedUser,
        updated_date: new Date(),
        status,
      };

      if (status !== existing.status) {
        requestBaseUpdate.status_updated_date = new Date();
      }

      const receiveDateParsed = parseDate(body.customer?.receiveFromUserDt);
      if (receiveDateParsed) {
        requestBaseUpdate.receive_from_user_date = receiveDateParsed;
      }
      parseDate(body.vendorReturnDate)
      const data: Prisma.repair_requestUpdateInput = { ...requestBaseUpdate };

      //* new flow update 
      if (status === 10) {
        //* Status 10 - customer and product details
        const item = existing.repair_item?.[0];
        if (body.product && item) {
          await tx.repair_item.update({
            where: { id: item.id },
            data: {
              product_type: body.product.productType ?? item.product_type,
              brand: body.product.brand ?? item.brand,
              model: body.product.model ?? item.model,
              serial_no: body.product.serial ?? item.serial_no,
              qty: body.product.qty ?? item.qty,
              sku_code: body.product.sku ?? item.sku_code,
              sku_flg: body.product.skuFlg ?? item.sku_flg,
              bar_code: body.product.barcode ?? item.bar_code,
              issue: body.product.issue ?? item.issue,
              updated_user: updatedUser,
            }
          });
        }
        if (body.warranty && item) {
          await tx.repair_item.update({
            where: { id: item.id },
            data: {
              in_warranty: body.warranty.status === "in" ? "Y" : body.warranty.status === "out" ? "N" : item.in_warranty,
              warranty_no: body.warranty.warrantyNo ?? item.warranty_no,
              updated_user: updatedUser,
            }
          });
        }
      } else if (status === 11) {
        //* Status 11 - cs sent to gr
        data.cs_send_to_gr_by = body.senderName ?? existing.cs_send_to_gr_by;
        data.cs_to_gr_receive_by = body.receiverName ?? existing.cs_to_gr_receive_by;
        data.cs_send_to_gr_date = parseDate(body.sendDate) ?? existing.cs_send_to_gr_date ?? undefined;
        data.cs_to_gr_tel = body.receiverTel ?? existing.cs_to_gr_tel;
      } else if (status === 201) {
        //* Status 201 - gr เปิด DC log
        data.gr_open_dc_log_by = body.grOpenLogBy ?? existing.gr_open_dc_log_by;
        data.gr_open_dc_log_date = parseDate(body.grOpenLogDate) ?? existing.gr_open_dc_log_date ?? undefined;
        data.approvelog_id = body.approvelogID ?? existing.approvelog_id;
      } else if (status === 21) {
        //* Status 21 - DC รับสินค้าจากสาขา
        data.dc_receiver_name = body.sentToDCName ?? existing.dc_receiver_name;
        data.dc_receiver_tel = body.dcReceiverTel ?? existing.dc_receiver_tel;
        data.dc_receive_date = parseDate(body.dcReceiveDate) ?? existing.dc_receive_date ?? undefined;
      } else if (status === 22) {
        //* Status 22 - DC รับสินค้าเข้าที่ DC
        data.arrive_to_dc_date = parseDate(body.dcArriveDate) ?? existing.arrive_to_dc_date ?? undefined;
      } else if (status === 23) {
        //* Status 23 - Vendor รับสินค้า
        data.vendor_name = body.vendorName ?? existing.vendor_name;
        data.send_to_vendor_by = body.receiverName ?? existing.send_to_vendor_by;
        data.send_to_vendor_date = parseDate(body.sendDate) ?? existing.send_to_vendor_date ?? undefined;
        data.send_to_vendor_tel = body.receiverTel ?? existing.send_to_vendor_tel;
      } else if (status === 232) {
        const quotations = body.quotationItems ?? [];
        if (quotations.length > 0) {
          await tx.quotation.deleteMany({
            where: { request_id: idNum },
          });

          const quotationData = quotations.map(q => ({
            request_id: idNum,
            quotation_no: q.quotation_no ?? null,
            review_price_date: parseDate(q.review_price_date) ?? undefined,
            repair_order: q.repair_order ?? "",
            num_of_repair_day: q.num_of_repair_day ?? "",
            num_of_guarantee_day: q.num_of_guarantee_day ?? "",
            part_cost: Number(q.part_cost ?? 0),
            part_warranty_flg: q.part_warranty_flg ?? "N",
            labor_cost: Number(q.labor_cost ?? 0),
            labor_warranty_flg: q.labor_warranty_flg ?? "N",
            total_part_cost: Number(q.total_part_cost ?? 0),
            total_labor_cost: Number(q.total_labor_cost ?? 0),
            total_cost: Number(q.total_cost ?? 0),
            user_approve_flg: "N",
            user_approve_date: undefined,
            created_user: updatedUser,
            updated_user: updatedUser,
          }));

          await tx.quotation.createMany({
            data: quotationData,
          });
        }
      } else if (status === 233) {
        if (body.userApproveFlg) {
          const quotations = await tx.quotation.findMany({
            where: { request_id: idNum },
            select: { id: true },
          });

          if (quotations.length > 0) {
            await tx.quotation.updateMany({
              where: { request_id: idNum },
              data: {
                user_approve_flg: body.userApproveFlg,
                user_approve_date: parseDate(body.userApproveDate) ?? undefined,
                ticket_no: body.ticketNo ?? null,
                updated_user: updatedUser,
              },
            });
          }
        }
      } else if (status === 234 || status === 235) {
        data.vendor_notified_by = body.notifierName ?? existing.vendor_notified_by;
        data.vendor_notified_date = parseDate(body.notifieDate) ?? existing.vendor_notified_date ?? undefined;
      } else if (status === 2360) {
        data.vendor_return_sent_by = body.vendorSentName ?? existing.vendor_return_sent_by;
        data.vendor_return_receive_by = body.vendorReceiveName ?? existing.vendor_return_receive_by;
        data.vendor_return_date = parseDate(body.vendorReturnDate) ?? existing.vendor_return_date ?? undefined;
        data.vendor_return_sender_tel = body.vendorSenderTel ?? existing.vendor_return_sender_tel;
      } else if (status === 2361) {
        data.dc_return_send_by = body.dcSentName ?? existing.dc_return_send_by;
        data.dc_return_receive_by = body.hoReceiverName ?? existing.dc_return_receive_by;
        data.dc_return_date = parseDate(body.dcReturnDate) ?? existing.dc_return_date ?? undefined;
        data.dc_return_tel = body.dcSentTel ?? existing.dc_return_tel;
      } else if (status === 236) {
        data.gr_send_return_to_cs_by = body.grSentName ?? existing.gr_send_return_to_cs_by;
        data.gr_send_return_to_cs_receive_by = body.csReceiverName ?? existing.gr_send_return_to_cs_receive_by;
        data.gr_send_return_to_cs_date = parseDate(body.grReturnDate) ?? existing.gr_send_return_to_cs_date ?? undefined;
        data.gr_send_return_to_cs_tel = body.grSentTel ?? existing.gr_send_return_to_cs_tel;
        data.location = body.location ?? existing.location;
      } else if (status === 237) {
        data.customer_receive_sent_by = body.sentName ?? existing.customer_receive_sent_by;
        data.customer_receive_by = body.customerName ?? existing.customer_receive_by;
        data.customer_receive_date = parseDate(body.sentProductReturnDate) ?? existing.customer_receive_date ?? undefined;
      } else if (status === 31) {
        //* Status 31 - vendor รับของ
        data.vendor_name = body.vendorName ?? existing.vendor_name;
        data.send_to_vendor_by = body.receiverName ?? existing.send_to_vendor_by;
        data.send_to_vendor_tel = body.receiverTel ?? existing.send_to_vendor_tel;
        data.send_to_vendor_date = parseDate(body.sendDate) ?? existing.send_to_vendor_date ?? undefined;
      } else if (status === 32) {
        //* Status 32 - quotation
        const quotations = body.quotationItems ?? [];
        if (quotations.length > 0) {
          await tx.quotation.deleteMany({
            where: { request_id: idNum },
          });

          const quotationData = quotations.map(q => ({
            request_id: idNum,
            quotation_no: q.quotation_no ?? null,
            review_price_date: parseDate(q.review_price_date) ?? undefined,
            repair_order: q.repair_order ?? "",
            num_of_repair_day: q.num_of_repair_day ?? "",
            num_of_guarantee_day: q.num_of_guarantee_day ?? "",
            part_cost: Number(q.part_cost ?? 0),
            part_warranty_flg: q.part_warranty_flg ?? "N",
            labor_cost: Number(q.labor_cost ?? 0),
            labor_warranty_flg: q.labor_warranty_flg ?? "N",
            total_part_cost: Number(q.total_part_cost ?? 0),
            total_labor_cost: Number(q.total_labor_cost ?? 0),
            total_cost: Number(q.total_cost ?? 0),
            user_approve_flg: "N",
            user_approve_date: undefined,
            created_user: updatedUser,
            updated_user: updatedUser,
          }));

          await tx.quotation.createMany({
            data: quotationData,
          });
        }
      } else if (status === 33) {
        //* Status 33 - user approve
        if (body.userApproveFlg) {
          const quotations = await tx.quotation.findMany({
            where: { request_id: idNum },
            select: { id: true },
          });

          if (quotations.length > 0) {
            await tx.quotation.updateMany({
              where: { request_id: idNum },
              data: {
                user_approve_flg: body.userApproveFlg,
                user_approve_date: parseDate(body.userApproveDate) ?? undefined,
                ticket_no: body.ticketNo ?? null,
                updated_user: updatedUser,
              },
            });
          }
        }
      } else if (status === 34 || status === 35) {
        //* แจ้งผลการตัดสินใจลูกค้าให้ vendor 34 ไม่ 35 ใช่
        data.vendor_notified_by = body.notifierName ?? existing.vendor_notified_by;
        data.vendor_notified_date = parseDate(body.notifieDate) ?? existing.vendor_notified_date ?? undefined;
      } else if (status === 361) {
        //* Status 361 - vendor ส่งคืนของซ่อมให้ gr
        data.vendor_return_sent_by = body.vendorSentName ?? existing.vendor_return_sent_by;
        data.vendor_return_receive_by = body.vendorReceiveName ?? existing.vendor_return_receive_by;
        data.vendor_return_date = parseDate(body.vendorReturnDate) ?? existing.vendor_return_date ?? undefined;
        data.vendor_return_sender_tel = body.vendorSenderTel ?? existing.vendor_return_sender_tel;
      } else if (status === 236) {
        //* Status 236 - gr return to cs (reject)
        data.gr_send_return_to_cs_by = body.grSentName ?? existing.gr_send_return_to_cs_by;
        data.gr_send_return_to_cs_receive_by = body.csReceiverName ?? existing.gr_send_return_to_cs_receive_by;
        data.gr_send_return_to_cs_date = parseDate(body.grReturnDate) ?? existing.gr_send_return_to_cs_date ?? undefined;
        data.gr_send_return_to_cs_tel = body.grSentTel ?? existing.gr_send_return_to_cs_tel;
        data.location = body.location ?? existing.location;
      } else if (status === 36) {
        //* Status 36 - gr ส่งคืนของให้ cs
        data.gr_send_return_to_cs_by = body.grSentName ?? existing.gr_send_return_to_cs_by;
        data.gr_send_return_to_cs_receive_by = body.csReceiverName ?? existing.gr_send_return_to_cs_receive_by;
        data.gr_send_return_to_cs_date = parseDate(body.grReturnDate) ?? existing.gr_send_return_to_cs_date ?? undefined;
        data.gr_send_return_to_cs_tel = body.grSentTel ?? existing.gr_send_return_to_cs_tel;
        data.location = body.location ?? existing.location;
      } else if (status === 37) {
        //* Status 37 - customer return product
        data.customer_receive_sent_by = body.sentName ?? existing.customer_receive_sent_by;
        data.customer_receive_by = body.customerName ?? existing.customer_receive_by;
        data.customer_receive_date = parseDate(body.sentProductReturnDate) ?? existing.customer_receive_date ?? undefined;
      }

      await prisma.repair_request.update({
        where: { id: idNum },
        data,
      });

      if (deletedAttachmentIds.length > 0) {
          await tx.repair_attachment.deleteMany({
            where: {
              id: { in: deletedAttachmentIds },
              request_id: idNum,
            },
          });
        }
      });


    if(files?.length) {
      if (files.length !== steps.length) {
        return NextResponse.json(
          { ok: false, message: "จำนวนไฟล์แนบไม่ตรงกับ step" },
          { status: 400 }
        );
      }

      const requestNo = existing.request_no || ``;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "repair", requestNo);

      await fs.mkdir(uploadDir, { recursive: true });

      const attachmentRows: Prisma.repair_attachmentCreateManyInput[] = [];

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const step = steps[i];
        if (!(f instanceof File)) continue;

        // ตั้งชื่อไม่ซ้ำ
        const ext = (f.name.split(".").pop() || "bin").toLowerCase();
        const safeBase = `${Date.now()}_${i + 1}`;
        const fileName = `${safeBase}.${ext}`;

        const absPath = path.join(uploadDir, fileName);
        const bytes = Buffer.from(await f.arrayBuffer());
        await fs.writeFile(absPath, bytes);

        const publicPath = `/uploads/repair/${requestNo}/${fileName}`;

        attachmentRows.push({
          request_id: idNum,
          file_path: publicPath,
          file_name: f.name,            // ชื่อเดิมไว้โชว์
          mime_type: f.type || null,
          file_size: f.size ?? null,
          step_no: step,
          updated_user: updatedUser,
        });
      }

      if (attachmentRows.length) {
        await prisma.repair_attachment.createMany({ data: attachmentRows });
      }
    }

    return NextResponse.json(
      { ok: true, message: "อัปเดตข้อมูลสำเร็จ", requestId: idNum },
      { status: 200 },
    );
  } catch (err) {
    console.error("update request error:", err);
    return NextResponse.json(
      { ok: false, message: "อัปเดตไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 },
    );
  }
}
