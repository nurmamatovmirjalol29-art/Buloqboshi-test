import pg from "pg";
const { Pool } = pg;

// Render PostgreSQL odatda DATABASE_URL muhit o'zgaruvchisi orqali beriladi.
// Mahalliy (localhost) ishlatganda SSL kerak emas, Render'da esa kerak.
const connectionString = process.env.DATABASE_URL;
const isLocal = connectionString && connectionString.includes("localhost");

export const pool = new Pool({
  connectionString,
  ssl: connectionString && !isLocal ? { rejectUnauthorized: false } : false
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      ism TEXT NOT NULL,
      email TEXT DEFAULT '',
      matn TEXT NOT NULL,
      sana TIMESTAMPTZ NOT NULL DEFAULT now(),
      approved BOOLEAN NOT NULL DEFAULT false,
      rasm TEXT DEFAULT '',
      rasm_public_id TEXT DEFAULT ''
    );
  `);
  await pool.query(`ALTER TABLE stories ADD COLUMN IF NOT EXISTS rasm_public_id TEXT DEFAULT '';`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS places (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      turi TEXT NOT NULL,
      tavsif TEXT DEFAULT '',
      manzil TEXT DEFAULT '',
      lat DOUBLE PRECISION,
      lng DOUBLE PRECISION,
      rasm TEXT DEFAULT '',
      rasm_public_id TEXT DEFAULT ''
    );
  `);
  await pool.query(`ALTER TABLE places ADD COLUMN IF NOT EXISTS rasm_public_id TEXT DEFAULT '';`);

  console.log("✅ Ma'lumotlar bazasi jadvallari tayyor (stories, places)");
}
