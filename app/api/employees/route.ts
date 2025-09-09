// app/api/employees/route.ts
export const runtime = "nodejs"; // wajib untuk driver pg di Vercel/Next.js

import { Pool } from "pg";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Helper response JSON + no-store bila perlu
function json(data: any, status = 200, noStore = false) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      ...(noStore ? { "cache-control": "no-store" } : {}),
    },
  });
}

// Normalisasi angka (>= 0)
function toNonNegativeNumber(v: any, def = 0): number {
  const n = Number(v);
  if (Number.isFinite(n) && n >= 0) return n;
  return def;
}

// ✅ GET semua karyawan (no-store supaya selalu segar)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const result = await pool.query(
      "SELECT id, name, position, daily_rate, weekly_allowance, image_url FROM employees ORDER BY id DESC"
    );
    return json(result.rows, 200, true);
  } catch (error) {
    console.error("GET /api/employees error:", error);
    return new NextResponse("Database read error", { status: 500 });
  }
}

// ✅ POST tambah karyawan baru
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  if ((user.role || "").toLowerCase() !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }
  try {
    const body = await req.json();
    let { name, position, daily_rate, weekly_allowance, image_url } = body || {};

    name = (name ?? "").toString().trim();
    position = (position ?? "").toString().trim();

    if (!name) return new NextResponse("Name is required", { status: 400 });
    if (!position) return new NextResponse("Position is required", { status: 400 });

    const dailyRate = toNonNegativeNumber(daily_rate, 0);
    const weeklyAllowance = toNonNegativeNumber(weekly_allowance, 0);

    const finalImageUrl =
      image_url && image_url.toString().trim() !== ""
        ? image_url.toString().trim()
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

    const result = await pool.query(
      `INSERT INTO employees (name, position, daily_rate, weekly_allowance, image_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, position, daily_rate, weekly_allowance, image_url`,
      [name, position, dailyRate, weeklyAllowance, finalImageUrl]
    );

    return json(result.rows[0], 201, true);
  } catch (error) {
    console.error("POST /api/employees error:", error);
    return new NextResponse("Database insert error", { status: 500 });
  }
}

// ✅ PUT update data karyawan (full update)
export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  if ((user.role || "").toLowerCase() !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }
  try {
    const body = await req.json();
    let { id, name, position, daily_rate, weekly_allowance, image_url } = body || {};

    const employeeId = Number(id);
    if (!Number.isFinite(employeeId) || employeeId <= 0) {
      return new NextResponse("Employee ID is required", { status: 400 });
    }

    name = (name ?? "").toString().trim();
    position = (position ?? "").toString().trim();
    if (!name) return new NextResponse("Name is required", { status: 400 });
    if (!position) return new NextResponse("Position is required", { status: 400 });

    const dailyRate = toNonNegativeNumber(daily_rate, 0);
    const weeklyAllowance = toNonNegativeNumber(weekly_allowance, 0);

    const finalImageUrl =
      image_url && image_url.toString().trim() !== ""
        ? image_url.toString().trim()
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

    const result = await pool.query(
      `UPDATE employees
         SET name = $1,
             position = $2,
             daily_rate = $3,
             weekly_allowance = $4,
             image_url = $5
       WHERE id = $6
       RETURNING id, name, position, daily_rate, weekly_allowance, image_url`,
      [name, position, dailyRate, weeklyAllowance, finalImageUrl, employeeId]
    );

    if (result.rows.length === 0) {
      return new NextResponse("Employee not found", { status: 404 });
    }

    return json(result.rows[0], 200, true);
  } catch (error) {
    console.error("PUT /api/employees error:", error);
    return new NextResponse("Database update error", { status: 500 });
  }
}

// ✅ DELETE hapus karyawan
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  if ((user.role || "").toLowerCase() !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const employeeId = Number(body?.id);

    if (!Number.isFinite(employeeId) || employeeId <= 0) {
      return new NextResponse("Employee ID is required", { status: 400 });
    }

    // Catatan: jika ada FK (mis. payroll.employee_id), sesuaikan ON DELETE di DB
    const result = await pool.query(
      `DELETE FROM employees WHERE id = $1
       RETURNING id, name, position, daily_rate, weekly_allowance, image_url`,
      [employeeId]
    );

    if (result.rows.length === 0) {
      return new NextResponse("Employee not found", { status: 404 });
    }

    return json({ success: true, deleted: result.rows[0] }, 200, true);
  } catch (error) {
    console.error("DELETE /api/employees error:", error);
    return new NextResponse("Database delete error", { status: 500 });
  }
}
