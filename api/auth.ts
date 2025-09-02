// pages/api/auth.ts
import type { NextApiRequest, NextApiResponse } from "next";
import sql from "../../lib/db";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username dan password wajib diisi" });
  }

  if (action === "signup") {
    const existing = await sql`SELECT * FROM users WHERE username = ${username}`;
    if (existing.length > 0) {
      return res.status(400).json({ error: "Username sudah digunakan" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await sql`INSERT INTO users (username, password) VALUES (${username}, ${hashed})`;

    return res.status(200).json({ success: true, user: username });
  }

  if (action === "login") {
    const users = await sql`SELECT * FROM users WHERE username = ${username}`;
    if (users.length === 0) {
      return res.status(400).json({ error: "User tidak ditemukan" });
    }

    const match = await bcrypt.compare(password, users[0].password);
    if (!match) {
      return res.status(401).json({ error: "Password salah" });
    }

    return res.status(200).json({ success: true, user: users[0].username });
  }

  return res.status(400).json({ error: "Action tidak valid" });
}
