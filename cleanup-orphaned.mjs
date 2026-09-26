import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupOrphanedUsers() {
  console.log("Fetching all auth users...");
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Error fetching users:", authError);
    return;
  }

  console.log(`Found ${users.length} total auth users.`);

  for (const user of users) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
    if (!profile) {
      console.log(`User ${user.email} (${user.id}) has NO profile! Deleting orphaned auth user...`);
      await supabase.auth.admin.deleteUser(user.id);
      console.log(`Deleted ${user.email}.`);
    } else {
      const { data: teacherProfile } = await supabase.from('teacher_profiles').select('user_id').eq('user_id', user.id).single();
      if (user.user_metadata?.role === 'teacher' && !teacherProfile) {
        console.log(`User ${user.email} (${user.id}) has NO teacher_profile! Deleting orphaned auth user...`);
        await supabase.auth.admin.deleteUser(user.id);
        await supabase.from('profiles').delete().eq('id', user.id);
        console.log(`Deleted ${user.email}.`);
      }
    }
  }
  console.log("Cleanup complete!");
}

cleanupOrphanedUsers();
