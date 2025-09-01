import type { NextApiRequest, NextApiResponse } from "next";
import { neon } from "@neondatabase/serverless";

// koneksi database via environment variable
const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      // ambil semua payrolls dari tabel
      const result = await sql`SELECT * FROM payrolls ORDER BY week DESC`;
      return res.status(200).json(result);
    }

    if (req.method === "POST") {
      const body = req.body;

      // simpan payroll baru
      const inserted = await sql`
        INSERT INTO payrolls (week, employee_id, total)
        VALUES (${body.week}, ${body.employee_id}, ${body.total})
        RETURNING *
      `;
      return res.status(201).json(inserted[0]);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    console.error("API /payrolls error:", err);
    return res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
}
