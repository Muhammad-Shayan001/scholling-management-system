import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findSubagentCampus() {
  console.log('Searching for "Subagent Campus"...');
  const { data: schools } = await supabase
    .from('schools')
    .select('*')
    .ilike('name', '%Subagent%');

  console.log('Found:', schools.length);
  schools.forEach(s => {
    console.log(`- [${s.id}] ${s.name} | Admin: ${s.admin_id} | Parent: ${s.parent_school_id}`);
  });
}

findSubagentCampus();
