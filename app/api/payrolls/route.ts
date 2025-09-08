import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ✅ GET semua payroll
export async function GET() {
  try {
    const result = await pool.query(
      `SELECT p.*, e.name, e.position 
       FROM payroll p 
       JOIN employees e ON p.employee_id = e.id
       ORDER BY p.id DESC`
    );
    return Response.json(result.rows);
  } catch (error) {
    console.error("GET /api/payroll error:", error);
    return new Response("Database read error", { status: 500 });
  }
}

// ✅ POST tambah payroll baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employee_id, week_start, week_end, total_days, total_salary } = body;

    if (!employee_id || !week_start || !week_end || !total_days || !total_salary) {
      return new Response("Semua field wajib diisi", { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO payroll (employee_id, week_start, week_end, total_days, total_salary) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [employee_id, week_start, week_end, total_days, total_salary]
    );

    return Response.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error("POST /api/payroll error:", error);
    if (error.code === "23505") {
      return new Response("Payroll untuk periode ini sudah ada", { status: 400 });
    }
    return new Response("Database insert error", { status: 500 });
  }
}

// ✅ DELETE payroll
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return new Response("Payroll ID is required", { status: 400 });
    }

    const result = await pool.query(
      `DELETE FROM payroll WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return new Response("Payroll not found", { status: 404 });
    }

    return Response.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    console.error("DELETE /api/payroll error:", error);
    return new Response("Database delete error", { status: 500 });
  }
}
