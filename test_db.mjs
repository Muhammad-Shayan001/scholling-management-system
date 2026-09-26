import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data, error } = await supabase.from('admin_profiles').select('*').limit(1);
console.log('admin_profiles:', error ? error.message : 'OK');

const { data: t, error: te } = await supabase.from('teachers').select('*').limit(1);
console.log('teachers:', te ? te.message : 'OK');

const { data: s, error: se } = await supabase.from('students').select('*').limit(1);
console.log('students:', se ? se.message : 'OK');

const { data: tp, error: tpe } = await supabase.from('teacher_profiles').select('*').limit(1);
console.log('teacher_profiles:', tpe ? tpe.message : 'OK');
