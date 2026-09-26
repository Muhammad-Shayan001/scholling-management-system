import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

// Supabase provides a direct Postgres connection string via the dashboard
// Format: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
// We'll try to read DB_URL from .env.local or construct it

const dbUrl = process.env.DATABASE_URL || process.env.DB_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  console.log('');
  console.log('========================================================');
  console.log('  MANUAL MIGRATION REQUIRED');  
  console.log('========================================================');
  console.log('No DATABASE_URL found in .env.local');
  console.log('');
  console.log('Please go to: Supabase Dashboard → SQL Editor');
  console.log('And run this SQL:');
  console.log('');
  console.log('-- Add batch_id to link students to academy courses/batches');
  console.log('ALTER TABLE public.student_profiles');
  console.log("ADD COLUMN IF NOT EXISTS batch_id UUID NULL;");
  console.log('');
  console.log('-- Add is_course flag so subjects can be marked as courses');
  console.log('ALTER TABLE public.subjects');
  console.log("ADD COLUMN IF NOT EXISTS is_course BOOLEAN NOT NULL DEFAULT false;");
  console.log('');
  console.log('-- Add description field to subjects');
  console.log('ALTER TABLE public.subjects');
  console.log("ADD COLUMN IF NOT EXISTS description TEXT NULL;");
  console.log('');
  console.log('========================================================');
  process.exit(0);
}

const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migration...');
    await client.query(`ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS batch_id UUID NULL`);
    console.log('✅ batch_id column added to student_profiles');
    await client.query(`ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS is_course BOOLEAN NOT NULL DEFAULT false`);
    console.log('✅ is_course column added to subjects');
    await client.query(`ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS description TEXT NULL`);
    console.log('✅ description column added to subjects');
    console.log('');
    console.log('✅ Migration complete!');
  } catch (e) {
    console.error('Migration failed:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
