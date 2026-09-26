import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('\n=================================================================');
  console.log('🚀 ADDING institution_type COLUMN TO schools TABLE');
  console.log('=================================================================\n');

  // We use the Supabase RPC endpoint to run arbitrary SQL
  // This requires a postgres function called exec_sql to exist. Let's try direct rpc first.
  const migrations = [
    // 1. Add institution_type column
    `ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS institution_type TEXT NOT NULL DEFAULT 'school'`,
    // 2. Add constraint for allowed values
    `ALTER TABLE public.schools DROP CONSTRAINT IF EXISTS schools_institution_type_check`,
    `ALTER TABLE public.schools ADD CONSTRAINT schools_institution_type_check CHECK (institution_type IN ('school', 'college', 'university', 'academy'))`,
  ];

  // Try via REST API SQL endpoint (Supabase Management API)
  // Fallback: use RPC if available
  let allSucceeded = true;

  for (const sql of migrations) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        // Try alternative RPC name
        const { error: error2 } = await supabase.rpc('execute_sql', { sql_text: sql });
        if (error2) {
          console.warn(`⚠️  RPC failed for: ${sql.substring(0, 60)}...`);
          console.warn('   Error:', error2.message);
          allSucceeded = false;
        } else {
          console.log(`✅ OK: ${sql.substring(0, 60)}...`);
        }
      } else {
        console.log(`✅ OK: ${sql.substring(0, 60)}...`);
      }
    } catch (e) {
      console.warn(`⚠️  Exception for: ${sql.substring(0, 60)}...`, e.message);
      allSucceeded = false;
    }
  }

  if (!allSucceeded) {
    console.log('\n=================================================================');
    console.log('⚠️  AUTOMATIC MIGRATION FAILED — RUN THIS SQL MANUALLY');
    console.log('=================================================================');
    console.log('👉 Go to your Supabase Dashboard → SQL Editor and run:\n');
    console.log(`-- =====================================================
-- ADD institution_type COLUMN TO schools TABLE
-- =====================================================

ALTER TABLE public.schools
ADD COLUMN IF NOT EXISTS institution_type TEXT NOT NULL DEFAULT 'school';

ALTER TABLE public.schools
DROP CONSTRAINT IF EXISTS schools_institution_type_check;

ALTER TABLE public.schools
ADD CONSTRAINT schools_institution_type_check
CHECK (institution_type IN ('school', 'college', 'university', 'academy'));

-- Also ensure all other dynamic columns exist
ALTER TABLE public.schools
ADD COLUMN IF NOT EXISTS short_name TEXT,
ADD COLUMN IF NOT EXISTS school_type TEXT DEFAULT 'Secondary School',
ADD COLUMN IF NOT EXISTS education_board TEXT DEFAULT 'Federal Board',
ADD COLUMN IF NOT EXISTS established_year INTEGER,
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS ntn_number TEXT,
ADD COLUMN IF NOT EXISTS school_motto TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#4f46e5',
ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#818cf8',
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS area TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS map_url TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Schema refresh is handled automatically after the migration completes.`);
    console.log('\n=================================================================\n');
  } else {
    // Verify the column now exists
    const { data, error } = await supabase
      .from('schools')
      .select('institution_type')
      .limit(1);

    if (error) {
      console.log('\n❌ Verification failed — column may still be missing:', error.message);
    } else {
      console.log('\n✅ SUCCESS! institution_type column is now in the schools table!');
    }
  }
}

runMigration();
