// api/auth.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email, password } = req.body;
    
    try {
      // Contoh penggunaan db dan bcrypt
      const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (user.rows.length > 0) {
        const isValidPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        
        if (isValidPassword) {
          res.status(200).json({ message: 'Login berhasil' });
        } else {
          res.status(401).json({ message: 'Password salah' });
        }
      } else {
        res.status(404).json({ message: 'Pengguna tidak ditemukan' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Tidak Diizinkan`);
  }
}