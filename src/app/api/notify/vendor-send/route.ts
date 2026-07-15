import { NextRequest, NextResponse } from "next/server";
import { VendorRepository } from "@/lib/repository/vendor.repo";
import { EmailService } from "@/lib/service/email.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sku, requestNo, requestId } = body;

    if (!sku || !requestNo || !requestId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Missing required fields: sku, requestNo, requestId",
        },
        { status: 400 }
      );
    }

    const vendorName = await VendorRepository.getVendorNameBySku(sku);

    if (!vendorName) {
      console.warn(`⚠️ No vendor found for SKU: ${sku}`);
      return NextResponse.json(
        {
          ok: false,
          message: `ไม่พบ vendor สำหรับ SKU: ${sku}`,
        },
        { status: 404 }
      );
    }

    const vendorEmail = await VendorRepository.getVendorEmailByName(
      vendorName
    );

    if (!vendorEmail) {
      console.warn(`⚠️ No email found for vendor: ${vendorName}`);
      return NextResponse.json(
        {
          ok: false,
          message: `ไม่พบอีเมลของ ${vendorName}`,
        },
        { status: 404 }
      );
    }

    const storeName = await VendorRepository.getStoreNameByRequestId(
      requestId
    );

    const emailHtml = EmailService.getVendorNotificationEmail(
      vendorName,
      requestNo,
      requestId,
      storeName,
    );

    const result = await EmailService.sendEmail({
      to: vendorEmail,
      subject: `โปรดเข้ารับสินค้าที่ลูกค้านำมาซ่อมที่ ${storeName} ใบแจ้งซ่อม : ${requestNo}`,
      html: emailHtml,
    });

    if (!result.ok) {
      throw new Error("Failed to send email");
    }

    return NextResponse.json({
      ok: true,
      message: `ส่งอีเมลไปที่ ${vendorEmail} สำเร็จ`,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("=== VENDOR NOTIFY ERROR ===", error);
    return NextResponse.json(
      {
        ok: false,
        message: "ส่งอีเมลไม่สำเร็จ",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
