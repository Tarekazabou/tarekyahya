// Node script to create a regular user via Supabase service role key.
// Usage (PowerShell example):
//   set SUPABASE_URL=https://your-project.supabase.co
//   set SUPABASE_SERVICE_ROLE_KEY=ey...service_role...
//   set USER_EMAIL=primavet2026@example.com
//   set USER_PASSWORD=Prepa69@Prepa69@
//   node scripts/create-user.js
// Do not expose the service role key in browsers or commit it to source control.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_EMAIL = process.env.USER_EMAIL;
const USER_PASSWORD = process.env.USER_PASSWORD;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
    process.exit(1);
}

if (!USER_EMAIL || !USER_PASSWORD) {
    console.error('Missing USER_EMAIL or USER_PASSWORD in environment.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createUser({ email, password }) {
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (error) {
        throw error;
    }
    return data;
}

(async () => {
    try {
        const user = await createUser({ email: USER_EMAIL, password: USER_PASSWORD });
        console.log('Created user:', user);
    } catch (err) {
        console.error('Error creating user:', err);
        process.exit(1);
    }
})();
