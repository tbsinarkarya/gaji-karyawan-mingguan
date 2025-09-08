import { Pool } from "pg";
import { NextResponse } from "next/server";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ✅ Ambil semua payroll
export async function GET() {
  try {
    const result = await pool.query(
      `SELECT p.*, e.name as employee_name
       FROM payroll p
       JOIN employees e ON p.employee_id = e.id
       ORDER BY p.id DESC`
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("GET /api/payrolls error:", error);
    return new NextResponse("Database read error", { status: 500 });
  }
}

// ✅ Simpan payroll baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeePayments } = body;

    if (!Array.isArray(employeePayments) || employeePayments.length === 0) {
      return new NextResponse("employeePayments is required", { status: 400 });
    }

    const saved: any[] = [];

    for (const p of employeePayments) {
      const { employeeId, daysWorked, totalAllowance, loanDeduction } = p;

      // hitung total gaji
      const empRes = await pool.query(
        "SELECT daily_rate, weekly_allowance FROM employees WHERE id = $1",
        [employeeId]
      );

      if (empRes.rows.length === 0) continue;
      const emp = empRes.rows[0];

      const total_salary =
        daysWorked * emp.daily_rate +
        emp.weekly_allowance +
        (totalAllowance || 0) -
        (loanDeduction || 0);

      const week_start = new Date(); // bisa kamu sesuaikan
      const week_end = new Date();
      week_end.setDate(week_start.getDate() + 6);

      const insertRes = await pool.query(
        `INSERT INTO payroll (employee_id, week_start, week_end, total_days, total_salary)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [employeeId, week_start, week_end, daysWorked, total_salary]
      );

      saved.push(insertRes.rows[0]);
    }

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("POST /api/payrolls error:", error);
    return new NextResponse("Database insert error", { status: 500 });
  }
}
