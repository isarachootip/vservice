import { NextResponse } from "next/server";
import { UserService } from "@/lib/service/users.service";
import { signToken, COOKIE_NAME } from "@/lib/authen";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { username, password } = await req.json();
  if (!username || !password)
    return NextResponse.json({ ok: false, message: "กรอกข้อมูลไม่ครบ" }, { status: 400 });

  const authUser = await UserService.validateLogin(username, password);
  if (!authUser) {
    return NextResponse.json({ ok: false, message: "ผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  // * full profile with permission
  const profile = await UserService.getUserProfile(username);
  if (!profile) {
    return NextResponse.json({ ok: false, message: "ไม่พบข้อมูลผู้ใช้" }, { status: 401 });
  }

  const token = await signToken(
    { sub: authUser.user_name, store: authUser.store_code },
    { expiresIn: "7d" }
  );

  const res = NextResponse.json({
    ok: true,
    user: profile
  });

  const cookieSecure = process.env.COOKIE_SECURE === "true";
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: "lax",
    path: "/",
  });

  return res;
}
