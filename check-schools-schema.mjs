import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSchema() {
  console.log('🔍 Checking schools table schema...');
  
  // We can't easily check columns via Supabase JS without RPC.
  // But we can try to insert a dummy record and see which columns fail.
  // Or better, just run the ALTER TABLE commands via a raw SQL if we had it.
  
  // Since we don't have raw SQL execution, we will provide a .sql file.
  // However, I can try to use the 'rpc' method if the user has a 'exec_sql' function.
  // Most Supabase projects don't have it by default for security.

  console.log('Attempting to detect missing columns by trial insertion...');
  
  const testData = {
    name: 'Schema Test',
    description: 'test',
    campus_code: 'test',
    campus_type: 'branch',
    campus_timing: 'test',
    theme_color: '#000000',
    is_active: true,
    code: 'test-schema-' + Date.now()
  };

  const { error } = await supabase.from('schools').insert(testData);
  
  if (error) {
    console.log('❌ Insertion failed:', error.message);
    if (error.message.includes("column \"description\" of relation \"schools\" does not exist")) {
      console.log('👉 CONFIRMED: "description" column is missing.');
    }
  } else {
    console.log('✅ Insertion succeeded. Schema might be fine now (cached refreshed?).');
  }
}

fixSchema();
