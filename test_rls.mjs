import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import jwt from 'jsonwebtoken';

const envConfig = String(readFileSync('.env.local'))
  .split('\n')
  .reduce((acc, line) => {
    const [k, v] = line.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const jwtSecret = envConfig.SUPABASE_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long'; // Try to sign a token to mimic user

const userId = 'af672af1-595f-4ff8-b5a4-1e15f730cd0e'; // The admin user we saw earlier

const payload = {
  aud: 'authenticated',
  exp: Math.floor(Date.now() / 1000) + (60 * 60),
  sub: userId,
  email: 'muhammad.shayan0927@gmail.com',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  role: 'authenticated'
};

const token = jwt.sign(payload, jwtSecret);

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: \Bearer \\ } }
});

async function test() {
  const { data, error } = await supabase.from('profiles').select('*, schools(*)').eq('id', userId).single();
  console.log("Data:", data);
  console.log("Error:", error);
}

test();
