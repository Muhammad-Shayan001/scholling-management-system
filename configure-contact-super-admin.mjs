import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simple UUID v4 generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0,
      v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function run() {
  const email = 'skolic.official@gmail.com';
  const fullName = 'Contact Admin';

  console.log(`\n🚀 Setting up super admin and contact position for: ${email}`);
  console.log('═'.repeat(60));

  try {
    // 1. Check if user exists in Supabase Auth
    console.log('\n1️⃣ Checking if user exists in Auth...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('❌ Error listing auth users:', listError.message);
      return;
    }

    let user = users.find(u => u.email === email);
    const userId = user?.id || generateUUID();

    if (!user) {
      console.log('   ⚠️ User not found in Auth. Creating user...');
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        id: userId,
        email: email,
        password: 'TempPassword123!@#',
        email_confirm: true,
        user_metadata: {
          role: 'super_admin',
          status: 'approved',
          full_name: fullName
        }
      });

      if (createError) {
        console.error('❌ Error creating Auth user:', createError.message);
        return;
      }
      user = createData.user;
      console.log('   ✅ Auth user created with ID:', user.id);
    } else {
      console.log('   ✅ Auth user found with ID:', user.id);
    }

    // 2. Create/Update profile with super_admin role
    console.log('\n2️⃣ Setting up profile as super_admin in database...');
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      email: email,
      full_name: fullName,
      role: 'super_admin',
      status: 'approved',
      school_id: null,
      updated_at: new Date().toISOString()
    });

    if (profileError) {
      console.error('❌ Error upserting into profiles table:', profileError.message);
      return;
    }
    console.log('   ✅ Profile configured as super_admin');

    // 3. Add as contact to all schools
    console.log('\n3️⃣ Fetching all schools...');
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, name, email, phone')
      .limit(100);

    if (schoolsError) {
      console.error('❌ Error fetching schools:', schoolsError.message);
      return;
    }

    if (schools && schools.length > 0) {
      console.log(`   Found ${schools.length} school(s)`);

      // Update schools with this email as contact
      console.log('\n4️⃣ Setting as contact email for schools...');
      for (const school of schools) {
        const { error: updateError } = await supabase
          .from('schools')
          .update({
            email: email,
            updated_at: new Date().toISOString()
          })
          .eq('id', school.id);

        if (updateError) {
          console.warn(`   ⚠️ Error updating school ${school.name}:`, updateError.message);
        } else {
          console.log(`   ✅ Updated ${school.name} contact email`);
        }
      }
    } else {
      console.log('   ⚠️ No schools found in database');
    }

    // 4. Verify the setup
    console.log('\n5️⃣ Verifying super admin setup...');
    const { data: verifiedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      console.log('   ✅ Verification successful!');
      console.log('\n📋 Profile Details:');
      console.log(`   • Email: ${verifiedProfile.email}`);
      console.log(`   • Full Name: ${verifiedProfile.full_name}`);
      console.log(`   • Role: ${verifiedProfile.role}`);
      console.log(`   • Status: ${verifiedProfile.status}`);
      console.log(`   • User ID: ${verifiedProfile.id}`);
    }

    console.log('\n' + '═'.repeat(60));
    console.log('🎉 Setup complete! The email is now configured as:');
    console.log('   ✓ Super Admin in the system');
    console.log('   ✓ Contact email for all schools');
    console.log('═'.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

run();

    if (!user) {
      console.log('   ⚠️ User not found in Auth. Creating user...');
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        id: userId,
        email: email,
        password: 'TempPassword123!@#',
        email_confirm: true,
        user_metadata: {
          role: 'super_admin',
          status: 'approved',
          full_name: fullName
        }
      });

      if (createError) {
        console.error('❌ Error creating Auth user:', createError.message);
        return;
      }
      user = createData.user;
      console.log('   ✅ Auth user created with ID:', user.id);
    } else {
      console.log('   ✅ Auth user found with ID:', user.id);
    }

    // 2. Create/Update profile with super_admin role
    console.log('\n2️⃣ Setting up profile as super_admin in database...');
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      email: email,
      full_name: fullName,
      role: 'super_admin',
      status: 'approved',
      school_id: null,
      updated_at: new Date().toISOString()
    });

    if (profileError) {
      console.error('❌ Error upserting into profiles table:', profileError.message);
      return;
    }
    console.log('   ✅ Profile configured as super_admin');

    // 3. Add as contact to all schools
    console.log('\n3️⃣ Fetching all schools...');
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, name, email, phone')
      .limit(100);

    if (schoolsError) {
      console.error('❌ Error fetching schools:', schoolsError.message);
      return;
    }

    if (schools && schools.length > 0) {
      console.log(`   Found ${schools.length} school(s)`);

      // Update schools with this email as contact
      console.log('\n4️⃣ Setting as contact email for schools...');
      for (const school of schools) {
        const { error: updateError } = await supabase
          .from('schools')
          .update({
            email: email,
            updated_at: new Date().toISOString()
          })
          .eq('id', school.id);

        if (updateError) {
          console.warn(`   ⚠️ Error updating school ${school.name}:`, updateError.message);
        } else {
          console.log(`   ✅ Updated ${school.name} contact email`);
        }
      }
    } else {
      console.log('   ⚠️ No schools found in database');
    }

    // 4. Verify the setup
    console.log('\n5️⃣ Verifying super admin setup...');
    const { data: verifiedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      console.log('   ✅ Verification successful!');
      console.log('\n📋 Profile Details:');
      console.log(`   • Email: ${verifiedProfile.email}`);
      console.log(`   • Full Name: ${verifiedProfile.full_name}`);
      console.log(`   • Role: ${verifiedProfile.role}`);
      console.log(`   • Status: ${verifiedProfile.status}`);
      console.log(`   • User ID: ${verifiedProfile.id}`);
    }

    console.log('\n' + '═'.repeat(60));
    console.log('🎉 Setup complete! The email is now configured as:');
    console.log('   ✓ Super Admin in the system');
    console.log('   ✓ Contact email for all schools');
    console.log('═'.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

run();
