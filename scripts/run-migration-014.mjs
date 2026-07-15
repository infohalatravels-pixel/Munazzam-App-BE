import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const migrationPath = path.resolve(
  __dirname,
  '../database/migrations/014_vendor_client_payments.sql',
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

  const { rows: txnCols } = await client.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name = 'transactions'
       AND column_name IN ('vendor_id', 'client_id', 'payment_mode')
     ORDER BY column_name`,
  );
  const { rows: tables } = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('transaction_vendor_items', 'transaction_client_items')
     ORDER BY table_name`,
  );

  console.log('new transaction columns:', txnCols);
  console.log('line item tables:', tables);
  console.log('Migration 014 complete.');
}

main()
  .catch((err) => {
    console.error('Migration failed:', err.message);
    process.exit(1);
  })
  .finally(() => client.end());
