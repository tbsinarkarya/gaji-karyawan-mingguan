import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NEON_DATABASE_URL!);

export default async function handler(req: any, res: any) {
  try {
    if (req.method === "GET") {
      // ambil semua payrolls urut dari terbaru
      const result = await sql`
        SELECT id, week_start_date, week_end_date, total_payroll, created_at
        FROM payrolls
        ORDER BY week_start_date DESC
      `;
      return res.status(200).json(result);
    }

    if (req.method === "POST") {
      const body = req.body;

      // validasi input sederhana
      if (!body.week_start_date || !body.week_end_date || !body.total_payroll) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // insert ke tabel sesuai schema
      const inserted = await sql`
        INSERT INTO payrolls (week_start_date, week_end_date, total_payroll)
        VALUES (${body.week_start_date}, ${body.week_end_date}, ${body.total_payroll})
        RETURNING id, week_start_date, week_end_date, total_payroll, created_at
      `;

      return res.status(201).json(inserted[0]);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    console.error("API /payrolls error:", err);
    return res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
}