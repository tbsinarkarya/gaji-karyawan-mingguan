import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { Payroll } from "../../src/types";

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const result = await sql<Payroll[]>`
        SELECT id, week_start_date, week_end_date, total_payroll, created_at
        FROM payrolls
        ORDER BY week_start_date DESC
      `;
      return res.status(200).json(result);
    }

    if (req.method === "POST") {
      const { week_start_date, week_end_date, total_payroll } = req.body;

      if (!week_start_date || !week_end_date || !total_payroll) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const inserted = await sql<Payroll[]>`
        INSERT INTO payrolls (week_start_date, week_end_date, total_payroll)
        VALUES (${week_start_date}, ${week_end_date}, ${total_payroll})
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
