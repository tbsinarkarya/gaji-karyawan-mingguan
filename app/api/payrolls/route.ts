export const runtime = "nodejs"; // penting agar pakai Node.js runtime

import { Pool } from "pg";
import { NextResponse } from "next/server";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Helper untuk build WeeklyPayroll
async function buildWeeklyPayroll(weekStart: string, weekEnd: string) {
  const res = await pool.query(
    `
    SELECT p.id as payroll_id, p.employee_id, p.total_days, p.total_salary,
           e.name, e.position, e.image_url, e.daily_rate, e.weekly_allowance,
           p.week_start, p.week_end
    FROM payroll p
    JOIN employees e ON p.employee_id = e.id
    WHERE p.week_start = $1::date AND p.week_end = $2::date
    ORDER BY p.id ASC
  `,
    [weekStart, weekEnd]
  );

  const employeePayments = res.rows.map((r) => {
    const days = Number(r.total_days);
    const dailyRate = Number(r.daily_rate ?? 0);
    const weeklyAllowance = Number(r.weekly_allowance ?? 0);
    const totalPay = Number(r.total_salary ?? 0);
    const basePay = dailyRate * days;
    const loanDeduction = Math.max(0, basePay + weeklyAllowance - totalPay);

    return {
      payrollId: r.payroll_id,
      employeeId: r.employee_id,
      employeeName: r.name,
      position: r.position,
      daysWorked: days,
      basePay,
      totalAllowance: weeklyAllowance,
      loanDeduction,
      totalPay,
      image_url: r.image_url ?? null,
    };
  });

  const totalPayroll = employeePayments.reduce((s, p) => s + (p.totalPay || 0), 0);
  const id = `${weekStart}_${weekEnd}`;

  return {
    id,
    weekStartDate: weekStart,
    weekEndDate: weekEnd,
    totalPayroll,
    employeePayments,
  };
}

// 🔹 GET semua payroll per minggu
export async function GET() {
  try {
    const weeksRes = await pool.query(
      `SELECT week_start, week_end
       FROM payroll
       GROUP BY week_start, week_end
       ORDER BY week_start DESC`
    );

    const weeks = weeksRes.rows;
    const payload = [];
    for (const w of weeks) {
      const wp = await buildWeeklyPayroll(w.week_start, w.week_end);
      payload.push(wp);
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/payrolls error:", error);
    return new NextResponse("Database read error", { status: 500 });
  }
}

// 🔹 POST tambah payroll baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeePayments, weekStartDate, weekEndDate } = body;

    if (!Array.isArray(employeePayments) || employeePayments.length === 0) {
      return new NextResponse("employeePayments is required", { status: 400 });
    }

    const weekStart = weekStartDate ? new Date(weekStartDate) : new Date();
    const weekEnd = weekEndDate
      ? new Date(weekEndDate)
      : new Date(new Date().setDate(weekStart.getDate() + 6));

    const ws = weekStart.toISOString().slice(0, 10);
    const we = weekEnd.toISOString().slice(0, 10);

    for (const p of employeePayments) {
      const employeeId = Number(p.employeeId);
      const daysWorked = Number(p.daysWorked || 0);
      const extraAllowance = Number(p.extraAllowance || 0);
      const totalAllowance = Number(p.totalAllowance || 0);
      const loanDeduction = Number(p.loanDeduction || 0);

      const empRes = await pool.query(
        `SELECT daily_rate, weekly_allowance FROM employees WHERE id = $1`,
        [employeeId]
      );
      if (empRes.rows.length === 0) continue;

      const emp = empRes.rows[0];
      const dailyRate = Number(emp.daily_rate ?? 0);
      const weeklyAllowance = Number(emp.weekly_allowance ?? 0);

      const basePay = dailyRate * daysWorked;
      const totalSalary = basePay + weeklyAllowance + totalAllowance + extraAllowance - loanDeduction;

      await pool.query(
        `INSERT INTO payroll (employee_id, week_start, week_end, total_days, total_salary)
         VALUES ($1, $2::date, $3::date, $4, $5)
         ON CONFLICT (employee_id, week_start, week_end)
         DO UPDATE SET total_days = EXCLUDED.total_days, total_salary = EXCLUDED.total_salary, created_at = now()`,
        [employeeId, ws, we, daysWorked, totalSalary]
      );
    }

    const weekly = await buildWeeklyPayroll(ws, we);
    return NextResponse.json(weekly, { status: 201 });
  } catch (error) {
    console.error("POST /api/payrolls error:", error);
    return new NextResponse("Database insert error", { status: 500 });
  }
}
