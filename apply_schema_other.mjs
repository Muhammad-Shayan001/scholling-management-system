import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    const sql = fs.readFileSync('fix_other_tables.sql', 'utf8');
    await client.query(sql);
    console.log('Applied fix_other_tables.sql');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
