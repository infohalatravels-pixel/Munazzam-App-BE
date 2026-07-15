import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const migrationPath = path.resolve(
  __dirname,
  '../database/migrations/016_flush_keep_admin.sql',
);
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is required in backend/.env');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function count(table) {
  try {
    const { rows } = await client.query(`SELECT COUNT(*)::int AS c FROM ${table}`);
    return rows[0]?.c ?? 0;
  } catch {
    return null;
  }
}

async function main() {
  const sql = await fs.readFile(migrationPath, 'utf8');
  await client.connect();
  console.log('Connected to Supabase Postgres...');
  console.log('Flushing all data except admin credentials...');
  await client.query(sql);

  const { rows: users } = await client.query(
    `SELECT email, first_name, last_name, employee_code, is_active
     FROM users
     WHERE deleted_at IS NULL
     ORDER BY email`,
  );

  const summary = {
    users: users.length,
    accounts: await count('accounts'),
    transactions: await count('transactions'),
    vendors: await count('vendors'),
    clients: await count('clients'),
    attendance: await count('attendance'),
    announcements: await count('announcements'),
    refresh_tokens: await count('refresh_tokens'),
  };

  console.log('Remaining users:', users);
  console.log('Row counts after flush:', summary);
  console.log('Flush complete. Login: admin@nasaq.qa / Admin@12345');
}

main()
  .catch((err) => {
    console.error('Flush failed:', err.message);
    process.exit(1);
  })
  .finally(() => client.end());
