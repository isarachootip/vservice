import { prisma } from "@/lib/database";
import { EmailService } from "@/lib/service/email.service";

export class NotificationService {
  static async sendNotification(requestId: number, type: "QUOTATION" | "READY_RETURN" | "NEAR_SLA", daysLeft?: number) {
    try {
      const request = await prisma.repair_request.findUnique({
        where: { id: requestId },
        include: {
          repair_item: true,
          quotation: {
            orderBy: { id: "desc" },
            take: 1
          }
        }
      });

      if (!request) {
        console.warn(`[Notification] Request ${requestId} not found.`);
        return { ok: false, message: "Request not found" };
      }

      const item = request.repair_item[0];
      const productDesc = item ? `${item.brand} ${item.model}` : "สินค้าของท่าน";
      const phone = request.phone || "ไม่ระบุเบอร์โทรศัพท์";
      const name = request.customer_name;
      const requestNo = request.request_no || "ไม่ระบุเลขใบแจ้งซ่อม";

      let message = "";
      let emailSubject = "";
      let emailHtml = "";

      if (type === "QUOTATION") {
        message = `เรียนคุณ ${name}, ใบแจ้งซ่อมเลขที่ ${requestNo} สำหรับ ${productDesc} ได้ประเมินราคาซ่อมเสร็จแล้ว โปรดตรวจสอบและอนุมัติใบเสนอราคาในระบบ`;
        emailSubject = `แจ้งผลประเมินราคาซ่อม ใบแจ้งซ่อมเลขที่ ${requestNo}`;
        emailHtml = `
          <html>
            <body style="font-family: sans-serif; color: #333; line-height: 1.6;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background: #fafafa;">
                <h2 style="color: #c8102e; border-bottom: 2px solid #c8102e; padding-bottom: 8px;">แจ้งผลประเมินราคาซ่อมสินค้า</h2>
                <p>เรียน คุณ <strong>${name}</strong>,</p>
                <p>สินค้า <strong>${productDesc}</strong> ตามใบแจ้งซ่อมเลขที่ <strong>${requestNo}</strong> ได้ทำการตรวจสอบและประเมินราคาซ่อมเรียบร้อยแล้ว</p>
                <p>โปรดเข้าสู่ระบบเพื่อตรวจสอบค่าใช้จ่าย อนุมัติ หรือปฏิเสธการดำเนินการซ่อมในขั้นตอนถัดไป</p>
                <div style="background: #fff; padding: 15px; border-left: 4px solid #c8102e; margin: 15px 0; font-size: 14px;">
                  <strong>ช่องทางการติดต่อกลับ:</strong> ${phone}<br/>
                  <strong>สถานะปัจจุบัน:</strong> รอการอนุมัติราคาจากลูกค้า
                </div>
                <p style="font-size: 11px; color: #888; margin-top: 30px; border-top: 1px dashed #ccc; padding-top: 10px;">
                  *อีเมลนี้ส่งจากระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้
                </p>
              </div>
            </body>
          </html>
        `;
      } else if (type === "READY_RETURN") {
        message = `เรียนคุณ ${name}, ${productDesc} ตามใบแจ้งซ่อมเลขที่ ${requestNo} ซ่อมเสร็จเรียบร้อยพร้อมส่งคืนแล้ว โปรดมารับสินค้าคืนที่สาขา`;
        emailSubject = `สินค้าซ่อมเสร็จสิ้นพร้อมส่งคืน ใบแจ้งซ่อมเลขที่ ${requestNo}`;
        emailHtml = `
          <html>
            <body style="font-family: sans-serif; color: #333; line-height: 1.6;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background: #fafafa;">
                <h2 style="color: #2e7d32; border-bottom: 2px solid #2e7d32; padding-bottom: 8px;">สินค้าซ่อมเสร็จสิ้นพร้อมส่งคืน</h2>
                <p>เรียน คุณ <strong>${name}</strong>,</p>
                <p>ขณะนี้สินค้า <strong>${productDesc}</strong> ตามใบแจ้งซ่อมเลขที่ <strong>${requestNo}</strong> ได้รับการดำเนินการซ่อมเสร็จเรียบร้อยและผ่านการทดสอบคุณภาพการใช้งานแล้ว</p>
                <p>ท่านสามารถติดต่อขอรับสินค้าคืนได้ที่จุดบริการลูกค้า ณ สาขาที่ท่านส่งซ่อม โปรดเตรียมใบรับเครื่องซ่อมเพื่อนำมาแสดงต่อเจ้าหน้าที่</p>
                <div style="background: #fff; padding: 15px; border-left: 4px solid #2e7d32; margin: 15px 0; font-size: 14px;">
                  <strong>เบอร์ติดต่อลูกค้า:</strong> ${phone}<br/>
                  <strong>สถานะปัจจุบัน:</strong> ซ่อมเสร็จสิ้น / รอส่งคืนสินค้าให้ลูกค้า
                </div>
                <p style="font-size: 11px; color: #888; margin-top: 30px; border-top: 1px dashed #ccc; padding-top: 10px;">
                  *อีเมลนี้ส่งจากระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้
                </p>
              </div>
            </body>
          </html>
        `;
      } else if (type === "NEAR_SLA") {
        const daysText = daysLeft !== undefined ? `${daysLeft} วัน` : "กำหนด";
        message = `แจ้งเตือนเจ้าหน้าที่สาขา: ใบแจ้งซ่อมเลขที่ ${requestNo} สำหรับคุณ ${name} (${productDesc}) ใกล้เกินกำหนด SLA แล้ว (เหลือเวลาอีก ${daysText})`;
        emailSubject = `⚠️ แจ้งเตือนด่วน: งานใกล้เกินกำหนด SLA ใบแจ้งซ่อมเลขที่ ${requestNo}`;
        emailHtml = `
          <html>
            <body style="font-family: sans-serif; color: #333; line-height: 1.6;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ffebee; border-radius: 8px; background: #fff8f8;">
                <h2 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 8px;">⚠️ แจ้งเตือนงานใกล้เกินกำหนดเวลาบริการ (SLA Warning)</h2>
                <p>เรียน ทีมงานศูนย์บริการ,</p>
                <p>งานใบแจ้งซ่อมเลขที่ <strong>${requestNo}</strong> ของลูกค้าคุณ <strong>${name}</strong> ใกล้จะเกินกำหนดระยะเวลาการให้บริการ (SLA)</p>
                <div style="background: #fff; padding: 15px; border-left: 4px solid #d32f2f; margin: 15px 0; font-size: 14px;">
                  <strong>ระยะเวลาที่เหลือ:</strong> <span style="color: #d32f2f; font-weight: bold;">เหลือเวลาอีก ${daysText}</span><br/>
                  <strong>สินค้า:</strong> ${productDesc}<br/>
                  <strong>ลูกค้า:</strong> คุณ ${name} (โทร. ${phone})
                </div>
                <p>โปรดเร่งรัดการดำเนินงานและติดต่อกับฝ่ายที่รับผิดชอบ (Vendor หรือ DC) เพื่อเร่งส่งมอบหรือแก้ไขโดยด่วน</p>
              </div>
            </body>
          </html>
        `;
      }

      // 1. Simulating SMS and LINE OA Delivery
      console.log(`📱 [SIMULATOR - SMS & LINE OA Sent]`);
      console.log(`   To Phone: ${phone}`);
      console.log(`   Content: ${message}`);

      // 2. Simulating email dispatch to customer proxy / store email
      console.log(`📧 [SIMULATOR - Customer Email Sent]`);
      console.log(`   Subject: ${emailSubject}`);

      // Log notification in transaction_log
      await prisma.transaction_log.create({
        data: {
          act_user_name: "system_notify",
          act_ip_address: "127.0.0.1",
          act_trans_log: `แจ้งเตือนอัตโนมัติ (${type === "NEAR_SLA" ? "SLA Alert" : "SMS/LINE OA/Email ถึงลูกค้า"}): ${message}`,
          step_no: "NOTIFY",
          request_id: requestId,
        }
      });

      return { ok: true };
    } catch (e: any) {
      console.error("❌ Notification service error:", e);
      return { ok: false, error: e.message };
    }
  }
}
