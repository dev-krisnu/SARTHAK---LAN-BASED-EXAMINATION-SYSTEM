import { NextResponse } from "next/server";

import { registerUser } from "@/lib/credentials";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    fullName?: string;
    username?: string;
    password?: string;
  };

  const fullName = body.fullName?.trim() ?? "";
  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";

  if (!fullName) {
    return NextResponse.json(
      { success: false, message: "Full name is required." },
      { status: 400 }
    );
  }

  if (!username) {
    return NextResponse.json(
      { success: false, message: "Username is required." },
      { status: 400 }
    );
  }

  const result = registerUser({
    fullName,
    username,
    password,
    role: "student",
  });

  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 400 }
    );
  }

  const token = await createSessionToken({
    username,
    fullName,
    role: "student",
  });

  const response = NextResponse.json({
    success: true,
    message: "Account created successfully.",
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
