import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkColumns() {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching schools:', error.message);
  } else if (data && data.length > 0) {
    console.log('Columns in schools table:', Object.keys(data[0]));
  } else {
    // If no data, try to fetch from a system table or just try an insert
    console.log('No data in schools table to check columns.');
  }
}

checkColumns();
