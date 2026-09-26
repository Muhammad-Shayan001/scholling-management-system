import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateBucket() {
  console.log("Updating profiles bucket...");
  const { data, error } = await supabase.storage.updateBucket('profiles', {
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: null // Allow all temporarily to see if it fixes it
  });

  if (error) {
    console.error("Error updating bucket:", error.message);
  } else {
    console.log("Successfully updated 'profiles' bucket!");
  }
}

updateBucket();
