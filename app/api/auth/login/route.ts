export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyLogin, createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const u = (username ?? "").toString().trim();
    const p = (password ?? "").toString();
    if (!u || !p) return new NextResponse("Username and password are required", { status: 400 });

    const user = await verifyLogin(u, p);
    if (!user) return new NextResponse("Invalid credentials", { status: 401 });

    const session = await createSession(user.id);
    const res = NextResponse.json({ id: user.id, username: user.username, role: user.role });
    res.cookies.set({
      name: "session",
      value: session.value,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: session.expires,
    });
    return res;
  } catch (err) {
    console.error("POST /api/auth/login error:", err);
    return new NextResponse("Login failed", { status: 500 });
  }
}
