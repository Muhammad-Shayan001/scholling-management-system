#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env.local') });

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;

if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
  console.error('❌ SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env.local');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedSuperAdmin() {
  console.log('🔧 Seeding super admin user...');

  try {
    // Check if super admin already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', SUPER_ADMIN_EMAIL)
      .single();

    if (existingProfile) {
      if (existingProfile.role === 'super_admin') {
        console.log('✅ Super admin already exists:', SUPER_ADMIN_EMAIL);
        return;
      } else {
        console.log('⚠️  User exists but is not super admin. Updating role...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'super_admin' })
          .eq('id', existingProfile.id);

        if (updateError) {
          throw updateError;
        }

        console.log('✅ Updated existing user to super admin');
        return;
      }
    }

    // Create new super admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: 'Super Administrator',
      },
    });

    if (authError) {
      throw authError;
    }

    console.log('✅ Created auth user:', authData.user.id);

    // The profiles table should auto-create via trigger, but let's verify
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !newProfile) {
      console.log('📝 Profile not found, creating manually...');
      const { error: insertError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: SUPER_ADMIN_EMAIL,
        full_name: 'Super Administrator',
        role: 'super_admin',
      });

      if (insertError) {
        throw insertError;
      }
    } else if (newProfile.role !== 'super_admin') {
      console.log('🔄 Updating profile role to super_admin...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', authData.user.id);

      if (updateError) {
        throw updateError;
      }
    }

    console.log('✅ Super admin created successfully!');
    console.log('📧 Email:', SUPER_ADMIN_EMAIL);
    console.log('🔐 Password: [hidden]');
    console.log('');
    console.log('You can now login at /login');
  } catch (error) {
    console.error('❌ Error seeding super admin:', error);
    process.exit(1);
  }
}

seedSuperAdmin();
