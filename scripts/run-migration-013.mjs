import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const migrationPath = path.resolve(
  __dirname,
  '../database/migrations/013_vendors_clients.sql',
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

  const { rows: vendors } = await client.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name = 'vendors' ORDER BY ordinal_position`,
  );
  const { rows: clients } = await client.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name = 'clients' ORDER BY ordinal_position`,
  );
  console.log('vendors columns:', vendors);
  console.log('clients columns:', clients);
  console.log('Migration 013 complete.');
}

main()
  .catch((err) => {
    console.error('Migration failed:', err.message);
    process.exit(1);
  })
  .finally(() => client.end());
