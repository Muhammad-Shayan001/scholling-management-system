import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupStorage() {
  console.log('Setting up storage buckets...');
  
  // Create 'profiles' bucket if it doesn't exist
  const { data: buckets } = await supabase.storage.listBuckets();
  const profilesExists = buckets?.find(b => b.name === 'profiles');
  
  if (!profilesExists) {
    const { error } = await supabase.storage.createBucket('profiles', {
      public: true,
      fileSizeLimit: 2097152, // 2MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
    });
    if (error) console.error('Error creating profiles bucket:', error);
    else console.log('Created profiles bucket');
  } else {
    console.log('Profiles bucket already exists');
  }
}

setupStorage();
