// app/api/payrolls/[id]/route.ts
export const runtime = "nodejs";

import { Pool } from "pg";
import { NextResponse } from "next/server";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * Hapus payroll:
 * - /api/payrolls/123            -> hapus 1 row by numeric id
 * - /api/payrolls/2025-09-01_2025-09-07 -> hapus semua row dalam periode tsb
 *
 * NOTE: Di Next.js 15, jangan ketatkan tipe argumen ke-2.
 * Pakai destructuring dengan `any` agar tidak ditolak oleh validator route.
 */
export async function DELETE(req: Request, { params }: any) {
  try {
    const id: string | undefined = params?.id;
    if (!id) {
      return new NextResponse("Payroll id required", { status: 400 });
    }

    // numeric id -> hapus 1 baris
    if (!Number.isNaN(Number(id))) {
      const delRes = await pool.query(
        `DELETE FROM payroll WHERE id = $1 RETURNING *`,
        [Number(id)]
      );
      if (delRes.rowCount === 0) {
        return new NextResponse("Payroll not found", { status: 404 });
      }
      return NextResponse.json({ success: true, deleted: delRes.rows[0] });
    }

    // weekStart_weekEnd -> hapus semua baris dalam periode
    if (id.includes("_")) {
      const [ws, we] = id.split("_");
      const delRes = await pool.query(
        `DELETE FROM payroll WHERE week_start = $1::date AND week_end = $2::date RETURNING id`,
        [ws, we]
      );
      return NextResponse.json({ success: true, deletedCount: delRes.rowCount });
    }

    return new NextResponse("Invalid id format", { status: 400 });
  } catch (error) {
    console.error("DELETE /api/payrolls/[id] error:", error);
    return new NextResponse("Database delete error", { status: 500 });
  }
}
