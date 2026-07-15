import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const migrationPath = path.resolve(__dirname, '../database/migrations/002_office_locations.sql');
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is required in backend/.env');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const sql = await fs.readFile(migrationPath, 'utf8');
  await client.connect();
  console.log('Connected to Supabase Postgres...');
  await client.query(sql);
  console.log('Migration 002 applied successfully.');

  const { rows } = await client.query(
    `SELECT key, value FROM settings WHERE key = 'office_locations'`,
  );
  console.log('office_locations:', JSON.stringify(rows[0]?.value, null, 2));
}

main()
  .catch((err) => {
    console.error('Migration failed:', err.message);
    process.exit(1);
  })
  .finally(() => client.end());
