// app/api/payrolls/route.ts
import { Pool } from "pg";
import { NextResponse } from "next/server";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

type DBRow = {
  payroll_id?: number;
  employee_id: number;
  total_days: number;
  total_salary: string | number;
  name: string;
  position: string;
  image_url: string | null;
  daily_rate: string | number;
  weekly_allowance: string | number;
  week_start: string;
  week_end: string;
};

// helper: bangun object WeeklyPayroll untuk satu periode
async function buildWeeklyPayroll(weekStart: string, weekEnd: string) {
  const res = await pool.query<DBRow>(
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

    // NOTE: kita tidak menyimpan extraAllowance/loanDeduction di tabel payroll.
    //      loanDeduction dihitung balik dari (base + weeklyAllowance) agar tetap ada angka potongan untuk tampilan.
    const loanDeduction = Math.max(0, basePay + weeklyAllowance - totalPay);

    return {
      payrollId: r.payroll_id,
      employeeId: r.employee_id,
      employeeName: r.name,
      position: r.position,
      daysWorked: days,
      basePay,
      totalAllowance: weeklyAllowance,
      // extraAllowance tidak tersedia di tabel saat ini => tidak dikembalikan
      loanDeduction,
      totalPay,
      image_url: r.image_url ?? null,
    };
  });

  const totalPayroll = employeePayments.reduce((s, p) => s + (p.totalPay || 0), 0);

  // id untuk card — gunakan kombinasi tanggal agar unik per periode
  const id = `${weekStart}_${weekEnd}`;

  return {
    id,
    weekStartDate: weekStart,
    weekEndDate: weekEnd,
    totalPayroll,
    employeePayments,
  };
}

// GET: kumpulkan periode (week_start, week_end) lalu bangun WeeklyPayroll[]
export async function GET() {
  try {
    const weeksRes = await pool.query<{ week_start: string; week_end: string }>(
      `SELECT week_start, week_end
       FROM payroll
       GROUP BY week_start, week_end
       ORDER BY week_start DESC`
    );

    const weeks = weeksRes.rows;
    const payload: any[] = [];
    for (const w of weeks) {
      const wp = await buildWeeklyPayroll(w.week_start, w.week_end);
      payload.push(wp);
    }

    // NON-CACHE agar selalu segar setelah create/delete
    return new NextResponse(JSON.stringify(payload), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/payrolls error:", error);
    return new NextResponse("Database read error", { status: 500 });
  }
}

// POST: menerima { employeePayments: [...], weekStartDate, weekEndDate }
// Akan INSERT (atau UPSERT jika unique constraint ada)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeePayments, weekStartDate, weekEndDate } = body;

    if (!Array.isArray(employeePayments) || employeePayments.length === 0) {
      return new NextResponse("employeePayments is required", { status: 400 });
    }

    // pastikan tanggal tersedia — jika tidak, default sekarang..+6
    const weekStart = weekStartDate ? new Date(weekStartDate) : new Date();
    const weekEnd = weekEndDate
      ? new Date(weekEndDate)
      : new Date(new Date().setDate(weekStart.getDate() + 6));

    const ws = weekStart.toISOString().slice(0, 10);
    const we = weekEnd.toISOString().slice(0, 10);

    const savedRows: any[] = [];

    for (const p of employeePayments) {
      const employeeId = Number(p.employeeId);
      const daysWorked = Number(p.daysWorked || 0);

      // ✅ PERBAIKAN: extraAllowance harus dari p.extraAllowance (BUKAN p.totalAllowance)
      const extraAllowance = Number(p.extraAllowance || 0);

      const loanDeduction = Number(p.loanDeduction || 0);

      // ambil rate employee terkini
      const empRes = await pool.query(
        `SELECT daily_rate, weekly_allowance FROM employees WHERE id = $1`,
        [employeeId]
      );
      if (empRes.rows.length === 0) {
        // skip bila employee tidak ditemukan
        continue;
      }
      const emp = empRes.rows[0];
      const dailyRate = Number(emp.daily_rate ?? 0);
      const weeklyAllowance = Number(emp.weekly_allowance ?? 0);

      const basePay = dailyRate * daysWorked;
      const totalSalary = basePay + weeklyAllowance + extraAllowance - loanDeduction;

      // upsert = jika sudah ada payroll untuk employee + week, maka update
      const upsert = await pool.query(
        `INSERT INTO payroll (employee_id, week_start, week_end, total_days, total_salary)
         VALUES ($1, $2::date, $3::date, $4, $5)
         ON CONFLICT (employee_id, week_start, week_end)
         DO UPDATE SET total_days = EXCLUDED.total_days,
                       total_salary = EXCLUDED.total_salary,
                       created_at = now()
         RETURNING *`,
        [employeeId, ws, we, daysWorked, totalSalary]
      );

      savedRows.push(upsert.rows[0]);
    }

    // bangun object WeeklyPayroll gabungan untuk periode tersebut
    const weekly = await buildWeeklyPayroll(ws, we);
    return new NextResponse(JSON.stringify(weekly), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("POST /api/payrolls error:", error);
    return new NextResponse("Database insert error", { status: 500 });
  }
}

// DELETE: hapus berdasarkan body { id } atau berdasarkan weekStart_weekEnd string
export async function DELETE(req: Request) {
  try {
    // coba baca body
    let id: string | number | null = null;
    try {
      const body = await req.json();
      id = body?.id ?? null;
    } catch {
      /* ignore */
    }

    // kalau tidak ada di body, coba parse dari url (mis. /api/payrolls/2025-09-01_2025-09-07 atau /api/payrolls/123)
    if (!id) {
      try {
        const url = new URL(req.url);
        const parts = url.pathname.split("/").filter(Boolean);
        const last = parts[parts.length - 1];
        if (last && last !== "api" && last !== "payrolls") id = last;
      } catch (e) {
        // ignore
      }
    }

    if (!id) {
      return new NextResponse("Payroll id or week identifier required", {
        status: 400,
      });
    }

    // jika id numeric → hapus row payroll dengan id
    if (!Number.isNaN(Number(id))) {
      const delRes = await pool.query(
        `DELETE FROM payroll WHERE id = $1 RETURNING *`,
        [Number(id)]
      );
      if (delRes.rows.length === 0)
        return new NextResponse("Payroll not found", { status: 404 });
      return NextResponse.json({ success: true, deleted: delRes.rows[0] });
    }

    // jika id berbentuk weekStart_weekEnd → hapus semua payroll di periode tersebut
    if (typeof id === "string" && id.includes("_")) {
      const [ws, we] = id.split("_");
      const delRes = await pool.query(
        `DELETE FROM payroll WHERE week_start = $1::date AND week_end = $2::date RETURNING *`,
        [ws, we]
      );
      return NextResponse.json({
        success: true,
        deletedCount: delRes.rowCount,
      });
    }

    return new NextResponse("Invalid id", { status: 400 });
  } catch (error) {
    console.error("DELETE /api/payrolls error:", error);
    return new NextResponse("Database delete error", { status: 500 });
  }
}
