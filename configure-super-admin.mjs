import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const email = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
  const userId = process.env.SUPER_ADMIN_USER_ID;
  const password = process.env.SUPER_ADMIN_PASSWORD || 'Superadmin123@';

  if (!email) {
    console.error('❌ NEXT_PUBLIC_SUPER_ADMIN_EMAIL is not set in .env.local');
    return;
  }

  console.log(`Setting up super admin for email: ${email}${userId ? `, ID: ${userId}` : ''}...`);

  // 1. Verify user in Supabase Auth
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Error listing auth users:', listError.message);
    return;
  }

  let user = users.find(u => (userId && u.id === userId) || u.email === email);

  if (!user) {
    console.log('⚠️ User not found in Auth by ID or email. Creating user...');
    const createPayload = {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'super_admin',
        status: 'approved',
        full_name: 'Super Admin'
      }
    };

    if (userId) {
      createPayload.id = userId;
    }

    const { data: createData, error: createError } = await supabase.auth.admin.createUser(createPayload);

    if (createError) {
      console.error('❌ Error creating Auth user:', createError.message);
      return;
    }
    user = createData.user;
    console.log('✅ Auth user created successfully with ID:', user.id);
  } else {
    console.log('✅ Auth user found in Supabase Auth with ID:', user.id);

    // Update the Auth user with exact email, password, and metadata
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        role: 'super_admin',
        status: 'approved',
        full_name: 'Super Admin'
      }
    });

    if (updateError) {
      console.error('❌ Error updating Auth user:', updateError.message);
      return;
    }
    user = updateData.user;
    console.log('✅ Auth user metadata and password updated successfully.');
  }

  // 2. Ensure profiles table has a row with all correct values
  console.log('Inserting/Upserting into profiles table...');
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    email: email,
    full_name: 'Super Admin',
    role: 'super_admin',
    status: 'approved',
    school_id: null, // Super admins don't need a specific school ID
    updated_at: new Date().toISOString()
  });

  if (profileError) {
    console.error('❌ Error upserting into profiles table:', profileError.message);
    return;
  }
  console.log('✅ Profiles table updated successfully!');

  // 3. Double check by running verify query
  const { data: verifiedProfile, error: verifyError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id);

  if (verifyError) {
    console.error('❌ Verification check failed:', verifyError.message);
  } else {
    console.log('🎉 Verification successful! Profile details in database:');
    console.log(JSON.stringify(verifiedProfile, null, 2));
  }
}

run();
