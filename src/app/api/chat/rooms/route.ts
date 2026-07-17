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
    const selectedLocId = searchParams.get("locationId");

    // Find all vendors
    const vendors = await prisma.vendor_info.findMany({
      orderBy: { vendor_name: "asc" }
    });

    // Find all locations
    const locations = await prisma.location.findMany({
      orderBy: { name: "asc" }
    });

    // Determine which location to use: if parameter is passed, use it. Otherwise use user's location, otherwise the first location.
    const userLocId = selectedLocId || profile.location_id || locations[0]?.id || "831";

    // Ensure rooms exist in database for the active location & vendors
    const roomUpserts = vendors.map(async (v) => {
      const existing = await prisma.chat_room.findUnique({
        where: {
          location_id_vendor_no: {
            location_id: userLocId,
            vendor_no: v.vendor_no
          }
        }
      });
      if (existing) return existing;
      return await prisma.chat_room.create({
        data: {
          location_id: userLocId,
          vendor_no: v.vendor_no
        }
      });
    });
    await Promise.all(roomUpserts);

    // Now query all rooms for this location, including last message
    const rooms = await prisma.chat_room.findMany({
      where: { location_id: userLocId },
      include: {
        messages: {
          orderBy: { created_at: "desc" },
          take: 1
        }
      }
    });

    // Map to channel objects
    const data = rooms.map(r => {
      const vendor = vendors.find(v => v.vendor_no === r.vendor_no);
      const loc = locations.find(l => l.id === r.location_id);
      const lastMsg = r.messages[0];
      return {
        id: r.id,
        name: vendor?.vendor_name || `Vendor #${r.vendor_no}`,
        vendor_no: r.vendor_no,
        location_id: r.location_id,
        location_name: loc?.name || `สาขา #${r.location_id}`,
        last_message: lastMsg ? {
          message: lastMsg.message,
          created_at: lastMsg.created_at,
          sender_name: lastMsg.sender_name
        } : null
      };
    });

    return NextResponse.json({ ok: true, rooms: data, user: profile, locations, vendors });
  } catch (err) {
    console.error("GET chat rooms error:", err);
    return NextResponse.json({ ok: false, message: "Failed to load chat rooms" }, { status: 500 });
  }
}
