import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "@/lib/authen";
import { UserService } from "@/lib/service/users.service";
import { prisma } from "@/lib/database";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    const username = String(payload.sub || "");
    const profile = await UserService.getUserProfile(username);
    if (!profile) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    // Load status descriptions
    const statusInfos = await prisma.status_info.findMany();

    // Query repair requests matching search query
    const requests = await prisma.repair_request.findMany({
      where: {
        OR: [
          { request_no: { contains: search, mode: "insensitive" } },
          { customer_name: { contains: search, mode: "insensitive" } }
        ]
      },
      orderBy: { created_date: "desc" },
      take: 50
    });

    if (requests.length === 0) {
      return NextResponse.json({ ok: true, rooms: [], user: profile });
    }

    // Ensure customer_chat exists for these requests
    const chatUpserts = requests.map(async (r) => {
      const existing = await prisma.customer_chat.findUnique({
        where: { request_id: r.id }
      });
      if (existing) return existing;
      return await prisma.customer_chat.create({
        data: { request_id: r.id }
      });
    });
    await Promise.all(chatUpserts);

    // Load customer chats with last message
    const chats = await prisma.customer_chat.findMany({
      where: {
        request_id: { in: requests.map(r => r.id) }
      },
      include: {
        messages: {
          orderBy: { created_at: "desc" },
          take: 1
        }
      }
    });

    const data = chats.map(c => {
      const req = requests.find(r => r.id === c.request_id);
      if (!req) return null;
      const statusDef = statusInfos.find(s => s.status_id === req.status);
      const lastMsg = c.messages[0];
      return {
        id: c.id,
        request_id: req.id,
        request_no: req.request_no || `REQ-${req.id}`,
        customer_name: req.customer_name,
        phone: req.phone,
        service_tier: req.service_tier || "NORMAL",
        status_id: req.status,
        status_name: statusDef?.status_name || `สถานะ #${req.status}`,
        // Distribute chat source randomly based on ID to make mock data interesting
        channel: req.id % 2 === 0 ? "LINE" as const : "WEB" as const,
        last_message: lastMsg ? {
          message: lastMsg.message,
          created_at: lastMsg.created_at,
          sender_name: lastMsg.sender_name,
          sender_type: lastMsg.sender_type as "AGENT" | "CUSTOMER"
        } : null
      };
    }).filter((x): x is NonNullable<typeof x> => x !== null);

    // Sort by last message date, or fallback to request creation time
    data.sort((a, b) => {
      const timeA = a.last_message ? new Date(a.last_message.created_at).getTime() : 0;
      const timeB = b.last_message ? new Date(b.last_message.created_at).getTime() : 0;
      return timeB - timeA;
    });

    return NextResponse.json({ ok: true, rooms: data, user: profile });
  } catch (err) {
    console.error("GET customer chat rooms error:", err);
    return NextResponse.json({ ok: false, message: "Failed to load chat rooms" }, { status: 500 });
  }
}
