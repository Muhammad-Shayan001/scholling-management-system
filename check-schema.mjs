import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking if schools table has the new columns...');
  const { data, error } = await supabase.from('schools').select('*').limit(1);
  if (error) {
    console.error('Error fetching schools:', error.message);
  } else {
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('Columns found:', columns.join(', '));
      const expected = ['short_name', 'school_type', 'primary_color', 'settings'];
      const missing = expected.filter(c => !columns.includes(c));
      if (missing.length > 0) {
        console.log('MISSING COLUMNS:', missing.join(', '));
      } else {
        console.log('Schema looks fully updated! All columns exist.');
      }
    } else {
      console.log('No schools found, but trying to get columns via a dummy insert error...');
      const { error: insertError } = await supabase.from('schools').insert({ short_name: 'test', school_type: 'test' });
      console.log('Insert error (expected RLS or missing column):', insertError?.message);
    }
  }
}

checkSchema();
