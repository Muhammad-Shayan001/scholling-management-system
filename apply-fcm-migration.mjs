import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('\n======================================================================');
  console.log('🚀 APPLYING FCM NOTIFICATION SYSTEM SCHEMA MIGRATION');
  console.log('======================================================================\n');

  try {
    const sql = fs.readFileSync('./update_notifications_system.sql', 'utf-8');
    console.log('Executing SQL migration via RPC...');

    const { error } = await supabase.rpc('execute_sql', { sql_text: sql });

    if (error) {
      console.warn('⚠️ execute_sql RPC failed or returned error:', error.message);
      console.log('\n------------------------------------------------------------');
      console.log('PLEASE EXECUTE THE FOLLOWING SQL MANUALLY IN YOUR SUPABASE CONSOLE');
      console.log('Link: ' + process.env.NEXT_PUBLIC_SUPABASE_URL.replace('.supabase.co', '.supabase.in') + ' (or your project settings)');
      console.log('------------------------------------------------------------\n');
      console.log(sql);
      console.log('\n------------------------------------------------------------');
      return { success: false, error: error.message };
    }

    console.log('✅ SQL migration completed successfully!');
    
    // Verify fcm_tokens table
    const { data, error: verifyError } = await supabase
      .from('fcm_tokens')
      .select('*')
      .limit(1);

    if (verifyError) {
      console.log('⚠️ Verification warning: fcm_tokens table check returned:', verifyError.message);
    } else {
      console.log('✅ Verification success: fcm_tokens table exists and is accessible!');
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Migration failed with error:', error);
    return { success: false, error: error.message };
  }
}

applyMigration();
