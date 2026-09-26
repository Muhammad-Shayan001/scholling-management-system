import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupBucket() {
  console.log("Creating profiles bucket...");
  const { data, error } = await supabase.storage.createBucket('profiles', {
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log("Bucket 'profiles' already exists.");
    } else {
      console.error("Error creating bucket:", error.message);
      return;
    }
  } else {
    console.log("Successfully created 'profiles' bucket!");
  }
}

setupBucket();
