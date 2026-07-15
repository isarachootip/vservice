import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "@/lib/authen";
import { UserService } from "@/lib/service/users.service";

export async function GET() {
  try {
    const cookieStore = await cookies(); 
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ authenticated: false, root: "cookieStore"}, { status: 401 });

    const payload = await verifyToken(token);
    const username = String(payload.sub || "");
    if (!username) return NextResponse.json({ authenticated: false, root: "verifyToken"}, { status: 401 });

    const profile = await UserService.getUserProfile(username);
    if (!profile) return NextResponse.json({ authenticated: false, root: "getUserProfile"}, { status: 401 });

    return NextResponse.json({ authenticated: true, user: profile });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
