export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = getPool();
    const r = await pool.query("select now() as now, version() as version");
    return NextResponse.json({ ok: true, now: r.rows[0].now, version: r.rows[0].version });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}

