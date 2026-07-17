import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "@/lib/authen";
import { UserService } from "@/lib/service/users.service";
import { prisma } from "@/lib/database";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");
    if (!roomId) {
      return NextResponse.json({ ok: false, message: "Missing roomId" }, { status: 400 });
    }

    const messages = await prisma.chat_message.findMany({
      where: { room_id: Number(roomId) },
      orderBy: { created_at: "asc" }
    });

    return NextResponse.json({ ok: true, messages });
  } catch (err) {
    console.error("GET chat messages error:", err);
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
    const { roomId, message, senderRole, senderName } = body;
    if (!roomId || !message?.trim()) {
      return NextResponse.json({ ok: false, message: "Missing roomId or message" }, { status: 400 });
    }

    // Determine sender details (allow simulation parameters for testing)
    const finalSenderId = profile.user_id;
    const finalSenderName = senderName || profile.user_full_name || profile.user_name;
    const finalSenderRole = senderRole || profile.role;

    const msg = await prisma.chat_message.create({
      data: {
        room_id: Number(roomId),
        sender_id: finalSenderId,
        sender_name: finalSenderName,
        sender_role: finalSenderRole,
        message: message.trim()
      }
    });

    return NextResponse.json({ ok: true, message: msg });
  } catch (err) {
    console.error("POST chat message error:", err);
    return NextResponse.json({ ok: false, message: "Failed to send message" }, { status: 500 });
  }
}
