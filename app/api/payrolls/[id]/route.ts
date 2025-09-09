// app/api/payrolls/[id]/route.ts
export const runtime = "nodejs";

import { Pool } from "pg";
import { NextResponse } from "next/server";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  try {
    const { id } = ctx.params;
    if (!id) return new NextResponse("Payroll id required", { status: 400 });

    if (!Number.isNaN(Number(id))) {
      const del = await pool.query(`DELETE FROM payroll WHERE id = $1 RETURNING *`, [Number(id)]);
      if (del.rowCount === 0) return new NextResponse("Payroll not found", { status: 404 });
      return NextResponse.json({ success: true, deleted: del.rows[0] });
    }

    if (id.includes("_")) {
      const [ws, we] = id.split("_");
      const del = await pool.query(
        `DELETE FROM payroll WHERE week_start = $1::date AND week_end = $2::date RETURNING id`,
        [ws, we]
      );
      return NextResponse.json({ success: true, deletedCount: del.rowCount });
    }

    return new NextResponse("Invalid id format", { status: 400 });
  } catch (e) {
    console.error("DELETE /api/payrolls/[id] error:", e);
    return new NextResponse("Database delete error", { status: 500 });
  }
}
