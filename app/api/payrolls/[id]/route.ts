export const runtime = "nodejs"; // pastikan pakai Node.js runtime

import { Pool } from "pg";
import { NextResponse } from "next/server";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// 🔹 DELETE payroll by id (numeric) atau periode (weekStart_weekEnd)
export async function DELETE(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

    if (!id) {
      return new NextResponse("Payroll id required", { status: 400 });
    }

    // jika id numeric → hapus 1 row payroll
    if (!Number.isNaN(Number(id))) {
      const delRes = await pool.query(
        `DELETE FROM payroll WHERE id = $1 RETURNING *`,
        [Number(id)]
      );
      if (delRes.rows.length === 0) {
        return new NextResponse("Payroll not found", { status: 404 });
      }
      return NextResponse.json({ success: true, deleted: delRes.rows[0] });
    }

    // jika id weekStart_weekEnd
    if (id.includes("_")) {
      const [ws, we] = id.split("_");
      const delRes = await pool.query(
        `DELETE FROM payroll WHERE week_start = $1::date AND week_end = $2::date RETURNING *`,
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
