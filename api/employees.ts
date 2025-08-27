import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const { rows } = await pool.query('SELECT * FROM employees ORDER BY id');
    res.status(200).json(rows);
  } else if (req.method === 'POST') {
    const { name, position, dailyRate, weeklyAllowance, imageUrl } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO employees (name, position, daily_rate, weekly_allowance, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, position, dailyRate, weeklyAllowance, imageUrl]
    );
    res.status(201).json(rows[0]);
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}