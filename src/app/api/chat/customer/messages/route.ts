import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "@/lib/authen";
import { UserService } from "@/lib/service/users.service";
import { prisma } from "@/lib/database";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");
    if (!chatId) {
      return NextResponse.json({ ok: false, message: "Missing chatId" }, { status: 400 });
    }

    const messages = await prisma.customer_chat_message.findMany({
      where: { chat_id: Number(chatId) },
      orderBy: { created_at: "asc" }
    });

    return NextResponse.json({ ok: true, messages });
  } catch (err) {
    console.error("GET customer chat messages error:", err);
    return NextResponse.json({ ok: false, message: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    const username = String(payload.sub || "");
    const profile = await UserService.getUserProfile(username);
    if (!profile) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { chatId, message, senderType, senderName } = body;
    if (!chatId || !message?.trim() || !senderType) {
      return NextResponse.json({ ok: false, message: "Missing required fields" }, { status: 400 });
    }

    const msg = await prisma.customer_chat_message.create({
      data: {
        chat_id: Number(chatId),
        sender_type: senderType, // "AGENT" or "CUSTOMER"
        sender_name: senderName || (senderType === "AGENT" ? (profile.user_full_name || profile.user_name) : "Customer"),
        message: message.trim()
      }
    });

    return NextResponse.json({ ok: true, message: msg });
  } catch (err) {
    console.error("POST customer chat message error:", err);
    return NextResponse.json({ ok: false, message: "Failed to send message" }, { status: 500 });
  }
}
