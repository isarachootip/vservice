import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTHEN_SECRET || "dev-secret");
export const COOKIE_NAME = process.env.AUTHEN_COOKIE || "app_auth";

export async function signToken(
  payload: Record<string, unknown>,
  { expiresIn = "7d" }: { expiresIn?: string } = {}
) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}
