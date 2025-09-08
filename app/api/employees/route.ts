import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ✅ GET semua karyawan
export async function GET() {
  try {
    const result = await pool.query("SELECT * FROM employees ORDER BY id DESC");
    return Response.json(result.rows);
  } catch (error) {
    console.error("GET /api/employees error:", error);
    return new Response("Database read error", { status: 500 });
  }
}

// ✅ POST tambah karyawan baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, position, daily_rate, weekly_allowance, image_url } = body;

    // Kalau image_url kosong/null → pakai avatar default
    const finalImageUrl =
      image_url && image_url.trim() !== ""
        ? image_url
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
            name
          )}&background=random`;

    const result = await pool.query(
      `INSERT INTO employees (name, position, daily_rate, weekly_allowance, image_url) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, position, daily_rate, weekly_allowance, finalImageUrl]
    );

    return Response.json(result.rows[0]);
  } catch (error) {
    console.error("POST /api/employees error:", error);
    return new Response("Database insert error", { status: 500 });
  }
}

// ✅ PUT update data karyawan
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, position, daily_rate, weekly_allowance, image_url } = body;

    if (!id) {
      return new Response("Employee ID is required", { status: 400 });
    }

    const finalImageUrl =
      image_url && image_url.trim() !== ""
        ? image_url
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
            name
          )}&background=random`;

    const result = await pool.query(
      `UPDATE employees 
       SET name = $1, position = $2, daily_rate = $3, weekly_allowance = $4, image_url = $5
       WHERE id = $6 RETURNING *`,
      [name, position, daily_rate, weekly_allowance, finalImageUrl, id]
    );

    if (result.rows.length === 0) {
      return new Response("Employee not found", { status: 404 });
    }

    return Response.json(result.rows[0]);
  } catch (error) {
    console.error("PUT /api/employees error:", error);
    return new Response("Database update error", { status: 500 });
  }
}

// ✅ DELETE hapus karyawan
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return new Response("Employee ID is required", { status: 400 });
    }

    const result = await pool.query(
      `DELETE FROM employees WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return new Response("Employee not found", { status: 404 });
    }

    return Response.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    console.error("DELETE /api/employees error:", error);
    return new Response("Database delete error", { status: 500 });
  }
}
