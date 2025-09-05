import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function GET() {
  try {
    const result = await pool.query("SELECT * FROM employees ORDER BY id DESC");
    return Response.json(result.rows);
  } catch (error) {
    return new Response("Database read error", { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, position, daily_rate, weekly_allowance, image_url } = body;

    const result = await pool.query(
      `INSERT INTO employees (name, position, daily_rate, weekly_allowance, image_url) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, position, daily_rate, weekly_allowance, image_url]
    );

    return Response.json(result.rows[0]);
  } catch (error) {
    return new Response("Database insert error", { status: 500 });
  }
}
