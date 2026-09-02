import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const SESSION_COOKIE = "gw_session";

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  cookies().set(SESSION_COOKIE, `${userId}::${token}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/"
  });
}

export async function getSession() {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const [userId] = raw.split("::");
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user;
}

export async function destroySession() {
  cookies().delete(SESSION_COOKIE);
}
