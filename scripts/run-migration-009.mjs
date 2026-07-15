import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const migrationPath = path.resolve(
  __dirname,
  '../database/migrations/009_keep_admin_only.sql',
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

async function main() {
  const sql = await fs.readFile(migrationPath, 'utf8');
  await client.connect();
  console.log('Connected to Supabase Postgres...');
  await client.query(sql);

  const { rows: users } = await client.query(
    `SELECT email, first_name, last_name, employee_code, is_active
     FROM users
     WHERE deleted_at IS NULL
     ORDER BY email`,
  );
  console.log('Remaining users:', users);
  console.log('Cleanup complete. Login: admin@nasaq.qa / Admin@12345');
}

main()
  .catch((err) => {
    console.error('Cleanup failed:', err.message);
    process.exit(1);
  })
  .finally(() => client.end());
