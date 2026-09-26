#!/usr/bin/env node

/**
 * Quick setup script for password reset system
 * This guides users through the manual setup steps
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.clear();
console.log('\n' + '═'.repeat(70));
console.log('🔐 PASSWORD RESET SYSTEM - QUICK SETUP GUIDE');
console.log('═'.repeat(70));

console.log(`
This guide will help you set up the password reset system in 3 simple steps.

⏱️ Time needed: ~5 minutes
📋 No coding required - just copy and paste!

`);

// Step 1
console.log('STEP 1: Create the Database Table');
console.log('─'.repeat(70));
console.log(`
1. Go to Supabase Dashboard:
   👉 https://app.supabase.com/project/[your-project-id]/sql/new

2. Copy the SQL code below (entire block):
`);

const sqlFile = fs.readFileSync(path.join(__dirname, 'CREATE_PASSWORD_RESET_TOKENS.sql'), 'utf-8');
console.log('┌' + '─'.repeat(68) + '┐');
sqlFile.split('\n').forEach(line => {
  console.log('│ ' + line.padEnd(68) + '│');
});
console.log('└' + '─'.repeat(68) + '┘');

console.log(`
3. Paste into Supabase SQL Editor
4. Click "Execute" button
5. Wait for success message ✅

`);

// Step 2
console.log('STEP 2: Verify Email Configuration');
console.log('─'.repeat(70));
console.log(`
Open your .env.local file and verify these are set:

SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password

If not set, follow these steps:

For Gmail Users:
─────────────────
1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification"
3. Go to: https://myaccount.google.com/apppasswords
4. Select: Mail and Windows Computer
5. Copy the generated 16-character password
6. Use this password as SMTP_PASS (remove spaces)

✅ Email is now configured!

`);

// Step 3
console.log('STEP 3: Test the System');
console.log('─'.repeat(70));
console.log(`
Run this command in your terminal:

  npm run test-password-reset

Expected output: ✅ ALL TESTS PASSED

If you see errors:
- Verify Step 1 (database table created)
- Verify Step 2 (email configured)
- Check the error message in the console

`);

// Final steps
console.log('═'.repeat(70));
console.log('🎉 ALL DONE! Here\'s what to do next:');
console.log('═'.repeat(70));

console.log(`
1. ✅ Start your development server:
   npm run dev

2. ✅ Test the forgot password flow:
   - Go to http://localhost:3000/login
   - Click "Forgot password?"
   - Enter an email address
   - Check your email for the reset link

3. ✅ Try different user roles:
   - Super Admin: skolic.official@gmail.com
   - Admin, Teacher, Student: use emails from your database

4. ✅ Production deployment:
   - Ensure SMTP_USER and SMTP_PASS are in production env vars
   - Test with real email before going live

`);

console.log('═'.repeat(70));
console.log('📖 Full documentation: PASSWORD_RESET_IMPLEMENTATION.md');
console.log('═'.repeat(70) + '\n');

console.log(`
Questions or issues?

1. Check PASSWORD_RESET_IMPLEMENTATION.md for detailed info
2. Run: node test-password-reset-flow.mjs (for diagnostics)
3. Verify Supabase dashboard for any errors

`);

console.log('✅ Setup guide complete!\n');
