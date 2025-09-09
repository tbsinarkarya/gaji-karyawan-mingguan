import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getPool } from "./db";

const SESSION_COOKIE = "session";
const SESSION_TTL_DAYS = 7; // session valid 7 days

function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function createSession(userId: number) {
  const pool = getPool();
  const raw = `${crypto.randomUUID()}.${crypto.randomBytes(24).toString("hex")}`;
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt.toISOString()]
  );
  ;(await cookies()).set({
    name: SESSION_COOKIE,
    value: raw,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const pool = getPool();
  const c = await cookies();
  const raw = c.get(SESSION_COOKIE)?.value;
  if (raw) {
    const tokenHash = hashToken(raw);
    await pool.query(`DELETE FROM sessions WHERE token_hash = $1`, [tokenHash]);
  }
  ;(await cookies()).set({ name: SESSION_COOKIE, value: "", path: "/", expires: new Date(0) });
}

export type CurrentUser = { id: number; username: string; role: string } | null;

export async function getCurrentUser(): Promise<CurrentUser> {
  try {
    const pool = getPool();
    const raw = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!raw) return null;
    const tokenHash = hashToken(raw);
    const res = await pool.query(
      `SELECT u.id, u.username, u.role
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = $1 AND s.expires_at > now()
        LIMIT 1`,
      [tokenHash]
    );
    if (res.rows.length === 0) return null;
    return { id: res.rows[0].id, username: res.rows[0].username, role: res.rows[0].role };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<NonNullable<CurrentUser>> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user!;
}

export async function registerUser(username: string, password: string, role?: string) {
  const pool = getPool();
  const exists = await pool.query(`SELECT 1 FROM users WHERE username = $1 LIMIT 1`, [username]);
  if (exists.rows.length) {
    throw new Error("USERNAME_IN_USE");
  }
  const hash = await bcrypt.hash(password, 10);
  const r = (role ?? "admin").toString();
  const res = await pool.query(
    `INSERT INTO users (username, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING id, username, role`,
    [username, hash, r]
  );
  return res.rows[0] as { id: number; username: string; role: string };
}

export async function verifyLogin(username: string, password: string) {
  const pool = getPool();
  const res = await pool.query(
    `SELECT id, username, role, password_hash FROM users WHERE username = $1 LIMIT 1`,
    [username]
  );
  if (!res.rows.length) return null;
  const row = res.rows[0];
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return null;
  return { id: row.id as number, username: row.username as string, role: row.role as string };
}
