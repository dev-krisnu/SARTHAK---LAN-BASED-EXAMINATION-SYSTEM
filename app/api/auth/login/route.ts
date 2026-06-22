import { NextResponse } from "next/server";

import { validateCredentials } from "@/lib/credentials";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    username?: string;
    password?: string;
  };

  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";

  if (!username || !password) {
    return NextResponse.json(
      { success: false, message: "Username and password are required." },
      { status: 400 }
    );
  }

  const user = validateCredentials(username, password);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Invalid username or password." },
      { status: 401 }
    );
  }

  const token = await createSessionToken({
    username: user.username,
    fullName: user.fullName,
    role: user.role,
  });

  const response = NextResponse.json({
    success: true,
    role: user.role,
    fullName: user.fullName,
    username: user.username,
  });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
