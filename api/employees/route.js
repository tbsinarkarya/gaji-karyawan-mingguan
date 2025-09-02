import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // wajib untuk Neon
});

// 📌 GET = ambil semua employees
// 📌 POST = tambah employee baru
export async function GET() {
  try {
    const result = await pool.query("SELECT * FROM employees ORDER BY id ASC");
    return new Response(JSON.stringify(result.rows), { status: 200 });
  } catch (error) {
    console.error("DB Error:", error);
    return new Response(JSON.stringify({ error: "Database error" }), {
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, position, daily_rate, weekly_allowance, image_url } = body;

    const result = await pool.query(
      `INSERT INTO employees (name, position, daily_rate, weekly_allowance, image_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, position, daily_rate, weekly_allowance, image_url]
    );

    return new Response(JSON.stringify(result.rows[0]), { status: 201 });
  } catch (error) {
    console.error("DB Error:", error);
    return new Response(JSON.stringify({ error: "Database error" }), {
      status: 500,
    });
  }
}
