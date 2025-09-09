export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST() {
  try {
    await destroySession();
    const res = NextResponse.json({ success: true });
    res.cookies.set({ name: "session", value: "", path: "/", expires: new Date(0) });
    return res;
  } catch (err) {
    console.error("POST /api/auth/logout error:", err);
    return new NextResponse("Logout failed", { status: 500 });
  }
}
