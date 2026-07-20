import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const events = body.events || [];

    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        const text = event.message.text.trim();
        const replyToken = event.replyToken;
        const userId = event.source.userId;

        // 1. Search for matching repair request
        let request = null;

        // Try searching by ID if it's a number
        if (/^\d+$/.test(text)) {
          request = await prisma.repair_request.findUnique({
            where: { id: parseInt(text) },
            include: { repair_item: true }
          });
        }

        // Try searching by request_no
        if (!request) {
          request = await prisma.repair_request.findUnique({
            where: { request_no: text },
            include: { repair_item: true }
          });
        }

        // Try searching by phone number (if customer types their phone)
        if (!request && text.length >= 9) {
          request = await prisma.repair_request.findFirst({
            where: { phone: { contains: text } },
            include: { repair_item: true },
            orderBy: { created_date: "desc" }
          });
        }

        // Fallback: If no match, match with the latest active request in system so it shows up in chat panel
        if (!request) {
          request = await prisma.repair_request.findFirst({
            include: { repair_item: true },
            orderBy: { created_date: "desc" }
          });
        }

        if (request) {
          // Get or create customer_chat room
          let chat = await prisma.customer_chat.findUnique({
            where: { request_id: request.id }
          });

          if (!chat) {
            chat = await prisma.customer_chat.create({
              data: { request_id: request.id }
            });
          }

          // Save message to database so agent sees it in real-time
          await prisma.customer_chat_message.create({
            data: {
              chat_id: chat.id,
              sender_type: "CUSTOMER",
              sender_name: `LINE User (${request.customer_name})`,
              message: text
            }
          });
        }

        // 2. Prepare Auto-Response Message
        let replyText = "";
        const lowerText = text.toLowerCase();

        if (lowerText === "แจ้งซ่อม") {
          replyText = "🔧 ท่านสามารถทำการแจ้งซ่อมสินค้าได้โดยกรอกข้อมูลรายละเอียดผ่านลิงก์นี้ได้เลยครับ:\nhttps://vservice.online/request/add";
        } else if (lowerText === "ตารางรถรับสินค้า") {
          replyText = "📅 ตารางรถรับสินค้าสำหรับศูนย์บริการไทวัสดุ:\n- ภาคกลาง/กรุงเทพฯ: ทุกวันจันทร์, พุธ, ศุกร์\n- ภาคอีสาน/เหนือ: ทุกวันอังคาร, พฤหัสบดี\n- ภาคใต้: ทุกวันเสาร์\n*(สอบถามข้อมูลเพิ่มเติม โทร. 1308)*";
        } else if (request && (text === String(request.id) || text === request.request_no)) {
          // If they successfully queried a ticket status
          const statusInfos = await prisma.status_info.findMany();
          const statusDef = statusInfos.find(s => s.status_id === request.status);
          const item = request.repair_item[0];
          const productDesc = item ? `${item.brand} ${item.model} (${item.product_type})` : "ไม่ระบุข้อมูลสินค้า";

          replyText = `🔍 ข้อมูลสถานะใบแจ้งซ่อมของคุณ:\n\n• เลขที่ใบซ่อม: ${request.request_no || request.id}\n• สินค้า: ${productDesc}\n• สถานะปัจจุบัน: ${statusDef?.status_name || "อยู่ระหว่างดำเนินการ"}\n\nหากต้องการสอบถามเพิ่มเติมเกี่ยวกับเคสนี้ พิมพ์ข้อความคุยกับเจ้าหน้าที่ตรงนี้ได้เลยครับ`;
        } else {
          // Welcome message/Main menu fallback
          replyText = "สวัสดีครับ ยินดีต้อนรับสู่บริการ VService ศูนย์แจ้งซ่อมสินค้าไทวัสดุ!\n\nกรุณาเลือกบริการที่ต้องการ:\n\n1. ตรวจสอบสถานะงานซ่อม\n👉 พิมพ์รหัสใบแจ้งซ่อมของคุณ (เช่น 1, 2)\n\n2. ตารางรถรับสินค้า\n👉 พิมพ์คำว่า 'ตารางรถรับสินค้า'\n\n3. แจ้งซ่อมสินค้าใหม่\n👉 พิมพ์คำว่า 'แจ้งซ่อม'\n\n4. ติดต่อเจ้าหน้าที่\n👉 พิมพ์ข้อความคำถามทิ้งไว้ได้เลยครับ เจ้าหน้าที่จะรีบตอบกลับโดยเร็วที่สุด";
        }

        // 3. Send reply message using LINE Messaging API
        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (token) {
          try {
            await fetch("https://api.line.me/v2/bot/message/reply", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                replyToken: replyToken,
                messages: [
                  {
                    type: "text",
                    text: replyText
                  }
                ]
              })
            });
            console.log(`[LINE Webhook] Replied to user ${userId} successfully.`);
          } catch (replyErr) {
            console.error("[LINE Webhook] Failed to call LINE reply API:", replyErr);
          }
        } else {
          console.warn("[LINE Webhook] LINE_CHANNEL_ACCESS_TOKEN is not configured in .env. Auto-response simulated in database.");
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[LINE Webhook] Error processing webhook:", err);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}
