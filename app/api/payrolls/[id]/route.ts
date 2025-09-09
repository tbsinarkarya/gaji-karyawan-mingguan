// app/api/payrolls/[id]/route.ts
import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function DELETE(req: Request) {
  try {
    // Ambil id dari URL (tanpa mengandalkan context params)
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const raw = parts[parts.length - 1]; // .../api/payrolls/[id]

    if (!raw) {
      return new NextResponse("Payroll id required", { status: 400 });
    }

    // Case 1: numeric id -> hapus 1 baris payroll
    if (!Number.isNaN(Number(raw))) {
      const del = await pool.query(
        `DELETE FROM payroll WHERE id = $1 RETURNING *`,
        [Number(raw)]
      );
      if (del.rowCount === 0) {
        return new NextResponse("Payroll not found", { status: 404 });
      }
      return NextResponse.json({ success: true, deleted: del.rows[0] });
    }

    // Case 2: "weekStart_weekEnd" -> hapus semua payroll di periode tsb
    if (raw.includes("_")) {
      const [ws, we] = raw.split("_");
      const del = await pool.query(
        `DELETE FROM payroll
         WHERE week_start = $1::date AND week_end = $2::date
         RETURNING id`,
        [ws, we]
      );
      return NextResponse.json({ success: true, deletedCount: del.rowCount });
    }

    return new NextResponse("Invalid id format", { status: 400 });
  } catch (err) {
    console.error("DELETE /api/payrolls/[id] error:", err);
    return new NextResponse("Database delete error", { status: 500 });
  }
}
