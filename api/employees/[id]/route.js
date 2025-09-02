import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// 📌 PUT = update data employee
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, position, daily_rate, weekly_allowance, image_url } = body;

    const result = await pool.query(
      `UPDATE employees 
       SET name=$1, position=$2, daily_rate=$3, weekly_allowance=$4, image_url=$5
       WHERE id=$6 RETURNING *`,
      [name, position, daily_rate, weekly_allowance, image_url, id]
    );

    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ error: "Employee not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(result.rows[0]), { status: 200 });
  } catch (error) {
    console.error("DB Error:", error);
    return new Response(JSON.stringify({ error: "Database error" }), {
      status: 500,
    });
  }
}

// 📌 DELETE = hapus data employee
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    const result = await pool.query("DELETE FROM employees WHERE id=$1", [id]);

    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ error: "Employee not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ message: "Employee deleted" }), {
      status: 200,
    });
  } catch (error) {
    console.error("DB Error:", error);
    return new Response(JSON.stringify({ error: "Database error" }), {
      status: 500,
    });
  }
}
