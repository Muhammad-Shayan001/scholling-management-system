import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
console.log("process.env.SUPABASE_SERVICE_ROLE_KEY =", process.env.SUPABASE_SERVICE_ROLE_KEY ? "STARTS WITH " + process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 15) : "UNDEFINED");
