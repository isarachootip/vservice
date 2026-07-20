import { NextResponse, type NextRequest } from "next/server";

const COOKIE = process.env.AUTH_COOKIE || "app_auth";
const PROTECTED = [/^\/menu/, /^\/request(\/|$)/, /^\/chat(\/|$)/];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!PROTECTED.some(re => re.test(pathname))) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|static|favicon.ico).*)"],
};
