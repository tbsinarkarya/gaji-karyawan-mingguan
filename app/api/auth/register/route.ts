export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { registerUser, createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { username, password, role } = await req.json();
    const u = (username ?? "").toString().trim();
    const p = (password ?? "").toString();
    const r = role ? (role || "").toString().trim() : undefined;
    if (!u) return new NextResponse("Username is required", { status: 400 });
    if (!p || p.length < 6) return new NextResponse("Password must be at least 6 characters", { status: 400 });

    const user = await registerUser(u, p, r);
    const session = await createSession(user.id);
    const res = NextResponse.json({ id: user.id, username: user.username, role: user.role }, { status: 201 });
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
  } catch (err: any) {
    if (err?.message === "USERNAME_IN_USE") {
      return new NextResponse("Username already in use", { status: 409 });
    }
    console.error("POST /api/auth/register error:", err);
    return new NextResponse("Registration failed", { status: 500 });
  }
}
