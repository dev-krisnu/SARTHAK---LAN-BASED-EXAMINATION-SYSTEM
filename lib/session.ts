import { SignJWT, jwtVerify } from "jose";

import type { UserRole } from "@/lib/credentials";

export type SessionPayload = {
  username: string;
  fullName: string;
  role: UserRole;
};

const SESSION_COOKIE = "exam-session";
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "lan-exam-hardcoded-session-secret"
);

export { SESSION_COOKIE };

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SESSION_SECRET);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    const username = payload.username;
    const fullName = payload.fullName;
    const role = payload.role;

    if (
      typeof username !== "string" ||
      typeof fullName !== "string" ||
      (role !== "admin" && role !== "student")
    ) {
      return null;
    }

    return { username, fullName, role };
  } catch {
    return null;
  }
}
