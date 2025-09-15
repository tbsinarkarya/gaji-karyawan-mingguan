// app/api/payrolls/route.ts
export const runtime = "nodejs";

import { Pool } from "pg";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

type Row = {
  payroll_id: number;
  employee_id: number;
  total_days: number;
  total_salary: string | number;
  total_allowance_input: string | number;
  extra_allowance: string | number;
  loan_deduction: string | number;
  name: string;
  position: string;
  image_url: string | null;
  daily_rate: string | number;
  weekly_allowance: string | number;
  week_start: string;
  week_end: string;
};

// Bangun payload mingguan untuk 1 periode
async function buildWeeklyPayroll(weekStart: string, weekEnd: string) {
  const res = await pool.query<Row>(
    `
    SELECT
      p.id AS payroll_id,
      p.employee_id,
      p.total_days,
      p.total_salary,
      p.total_allowance_input,
      p.extra_allowance,
      p.loan_deduction,
      e.name,
      e.position,
      e.image_url,
      e.daily_rate,
      e.weekly_allowance,
      p.week_start,
      p.week_end
    FROM payroll p
    JOIN employees e ON p.employee_id = e.id
    WHERE p.week_start = $1::date AND p.week_end = $2::date
    ORDER BY p.id ASC
    `,
    [weekStart, weekEnd]
  );

  const employeePayments = res.rows.map((r) => {
    const daysWorked          = Number(r.total_days);
    const dailyRate           = Number(r.daily_rate ?? 0);
    const weeklyAllowanceBase = Number(r.weekly_allowance ?? 0); // referensi (gaji dasar karyawan)
    const totalAllowanceInput = Number(r.total_allowance_input ?? 0); // yang kamu isi di kalkulator
    const extraAllowance      = Number(r.extra_allowance ?? 0);
    const loanDeduction       = Number(r.loan_deduction ?? 0);
    const basePay             = dailyRate * daysWorked;
    const totalPay            = Number(r.total_salary ?? 0);

    return {
      payrollId: r.payroll_id,
      employeeId: r.employee_id,
      employeeName: r.name,
      position: r.position,
      daysWorked,
      basePay,
      // tampilkan angka sesuai input aktual
      totalAllowance: totalAllowanceInput,
      extraAllowance,
      loanDeduction,
      totalPay,
      image_url: r.image_url ?? null,
      // (opsional) kalau mau tampilkan juga weeklyAllowanceBase untuk referensi:
      weeklyAllowanceBase,
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

// GET: kelompokkan per minggu
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  try {
    // Single-query aggregation untuk menghindari N+1 query per minggu
    const agg = await pool.query<{
      week_start: string;
      week_end: string;
      total_payroll: string | number;
      employee_payments: any[];
    }>(
      `
      SELECT
        TO_CHAR(p.week_start, 'YYYY-MM-DD') AS week_start,
        TO_CHAR(p.week_end,   'YYYY-MM-DD') AS week_end,
        SUM(p.total_salary) AS total_payroll,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'payrollId', p.id,
            'employeeId', p.employee_id,
            'employeeName', e.name,
            'position', e.position,
            'daysWorked', p.total_days,
            'basePay', (COALESCE(e.daily_rate,0) * COALESCE(p.total_days,0)),
            'totalAllowance', p.total_allowance_input,
            'extraAllowance', p.extra_allowance,
            'loanDeduction', p.loan_deduction,
            'totalPay', p.total_salary,
            'image_url', e.image_url,
            'weeklyAllowanceBase', e.weekly_allowance
          )
          ORDER BY p.id ASC
        ) AS employee_payments
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      GROUP BY p.week_start, p.week_end
      ORDER BY p.week_start DESC
      `
    );

    const payload = agg.rows.map((r) => ({
      id: `${r.week_start}_${r.week_end}`,
      weekStartDate: r.week_start,
      weekEndDate: r.week_end,
      totalPayroll: Number(r.total_payroll ?? 0),
      employeePayments: Array.isArray(r.employee_payments) ? r.employee_payments : [],
    }));

    return new NextResponse(JSON.stringify(payload), {
      status: 200,
      headers: {
        "content-type": "application/json",
        // Izinkan CDN caching singkat untuk percepat load ulang
        "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("GET /api/payrolls error:", error);
    return new NextResponse("Database read error", { status: 500 });
  }
}

// POST: simpan per-employee untuk periode
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  {
    const role = (user.role || "").toLowerCase();
    if (role !== "admin" && role !== "staff") {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }
  try {
    const body = await req.json();
    const { employeePayments, weekStartDate, weekEndDate } = body;

    if (!Array.isArray(employeePayments) || employeePayments.length === 0) {
      return new NextResponse("employeePayments is required", { status: 400 });
    }

    const weekStart = weekStartDate ? new Date(weekStartDate) : new Date();
    const weekEnd   = weekEndDate   ? new Date(weekEndDate)   : new Date(new Date().setDate(weekStart.getDate() + 6));

    const ws = weekStart.toISOString().slice(0, 10);
    const we = weekEnd.toISOString().slice(0, 10);

    for (const p of employeePayments) {
      const employeeId         = Number(p.employeeId);
      const daysWorked         = Number(p.daysWorked || 0);
      const totalAllowanceInp  = Number(p.totalAllowance || 0); // dari kalkulator (auto/manual)
      const extraAllowance     = Number(p.extraAllowance || 0);
      const loanDeduction      = Number(p.loanDeduction || 0);

      // Ambil rate terkini (hanya untuk dapat basePay = daily_rate * daysWorked)
      const empRes = await pool.query(
        `SELECT daily_rate FROM employees WHERE id = $1`,
        [employeeId]
      );
      if (empRes.rows.length === 0) continue;

      const dailyRate = Number(empRes.rows[0].daily_rate ?? 0);
      const basePay   = dailyRate * daysWorked;

      // Rumus yang kamu minta:
      // total_salary = basePay + totalAllowanceInp + extraAllowance - loanDeduction
      const totalSalary = basePay + totalAllowanceInp + extraAllowance - loanDeduction;

      // UPSERT per (employee_id, week_start, week_end)
      await pool.query(
        `INSERT INTO payroll (employee_id, week_start, week_end, total_days, total_salary, total_allowance_input, extra_allowance, loan_deduction)
         VALUES ($1, $2::date, $3::date, $4, $5, $6, $7, $8)
         ON CONFLICT (employee_id, week_start, week_end)
         DO UPDATE SET
           total_days            = EXCLUDED.total_days,
           total_salary          = EXCLUDED.total_salary,
           total_allowance_input = EXCLUDED.total_allowance_input,
           extra_allowance       = EXCLUDED.extra_allowance,
           loan_deduction        = EXCLUDED.loan_deduction,
           created_at            = now()`,
        [employeeId, ws, we, daysWorked, totalSalary, totalAllowanceInp, extraAllowance, loanDeduction]
      );
    }

    const weekly = await buildWeeklyPayroll(ws, we);
    return new NextResponse(JSON.stringify(weekly), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("POST /api/payrolls error:", error);
    return new NextResponse("Database insert error", { status: 500 });
  }
}
