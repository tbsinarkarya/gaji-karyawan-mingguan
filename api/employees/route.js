// app/api/employees/route.js
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function GET() {
  console.log("➡️ GET /api/employees dipanggil");
  try {
    const result = await pool.query("SELECT * FROM employees ORDER BY id DESC");
    console.log("✅ GET berhasil, jumlah data:", result.rows.length);
    return Response.json(result.rows);
  } catch (error) {
    console.error("❌ GET error:", error.message);
    return new Response("Database read error", { status: 500 });
  }
}

export async function POST(req) {
  console.log("➡️ POST /api/employees dipanggil");
  try {
    const body = await req.json();
    console.log("📦 Data diterima dari client:", body);

    const { name, position, daily_rate, weekly_allowance, image_url } = body;
    const result = await pool.query(
      `INSERT INTO employees (name, position, daily_rate, weekly_allowance, image_url) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, position, daily_rate, weekly_allowance, image_url]
    );

    console.log("✅ Data berhasil disimpan ke DB:", result.rows[0]);
    return Response.json(result.rows[0]);
  } catch (error) {
    console.error("❌ POST error:", error.message);
    return new Response("Database insert error", { status: 500 });
  }
}
