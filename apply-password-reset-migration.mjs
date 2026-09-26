import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('\n' + '═'.repeat(70));
  console.log('🚀 APPLYING PASSWORD RESET TOKENS MIGRATION');
  console.log('═'.repeat(70));

  try {
    // Read the migration SQL
    const sql = fs.readFileSync('./CREATE_PASSWORD_RESET_TOKENS.sql', 'utf-8');

    console.log('\n📝 Running migration SQL...\n');

    // Execute the migration
    const { error } = await supabase.rpc('execute_sql', { sql_text: sql });

    if (error && error.message && error.message.includes('does not exist')) {
      // If execute_sql doesn't exist, we'll use a different approach
      console.log('⚠️ Using alternative migration approach...\n');

      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          // Use the generic query approach for migrations
          // Note: This is a workaround since Supabase client doesn't directly support arbitrary DDL
          console.log('📌 Statement:', statement.substring(0, 60) + '...');
          
          // For now, we'll just log what needs to be run
          console.log('   (Please run this in Supabase SQL Editor)');
        } catch (e) {
          console.error('Error:', e);
        }
      }

      console.log('\n⚠️ IMPORTANT: Please execute the following SQL in Supabase Dashboard:');
      console.log('   1. Go to: https://app.supabase.com/project/_/sql/new');
      console.log('   2. Copy contents of CREATE_PASSWORD_RESET_TOKENS.sql');
      console.log('   3. Paste and execute');
      console.log('\nSQL to run:');
      console.log('═'.repeat(70));
      console.log(sql);
      console.log('═'.repeat(70));

      return { success: false, message: 'Manual execution required' };
    }

    if (error) {
      throw error;
    }

    console.log('\n✅ Migration applied successfully!');

    // Verify the table was created
    console.log('\n✓ Verifying table creation...');
    const { data: tableData, error: verifyError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .limit(1);

    if (verifyError) {
      console.log('⚠️ Table may not be ready yet. Status:', verifyError.message);
    } else {
      console.log('✅ password_reset_tokens table verified!');
    }

    console.log('\n' + '═'.repeat(70));
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY');
    console.log('═'.repeat(70) + '\n');

    return { success: true };

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log('\n⚠️ Please run the following SQL in Supabase Dashboard manually:');
    console.log('   File: CREATE_PASSWORD_RESET_TOKENS.sql');
    console.log('═'.repeat(70));

    try {
      const sql = fs.readFileSync('./CREATE_PASSWORD_RESET_TOKENS.sql', 'utf-8');
      console.log(sql);
    } catch (e) {
      console.log('Could not read migration file');
    }

    console.log('═'.repeat(70));
    return { success: false, error: error.message };
  }
}

applyMigration();
