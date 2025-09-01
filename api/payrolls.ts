import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { WeeklyPayroll } from "../src/types";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing DATABASE_URL environment variable");
}

const sql = neon(connectionString);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const result = await sql`
        SELECT id, week_start_date, week_end_date, total_payroll, created_at
        FROM payrolls
        ORDER BY week_start_date DESC
      ` as WeeklyPayroll[];

      return res.status(200).json(result);
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { week_start_date, week_end_date, total_payroll } = body;

      if (!week_start_date || !week_end_date || !total_payroll) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // ⬇️ inserted didefinisikan disini (scope aman)
      const inserted = await sql`
        INSERT INTO payrolls (week_start_date, week_end_date, total_payroll)
        VALUES (${week_start_date}, ${week_end_date}, ${total_payroll})
        RETURNING id, week_start_date, week_end_date, total_payroll, created_at
      ` as WeeklyPayroll[];

      return res.status(201).json(inserted[0]); // ⬅️ tidak akan error
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    console.error("API /payrolls error:", err);
    return res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
}

