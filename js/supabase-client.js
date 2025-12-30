/**
 * Supabase Client Configuration
 * Primavet Website
 */

// Supabase Configuration
const SUPABASE_URL = 'https://sqjtchehpuwiwyqkyxft.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__F4mGFxKygUTBqJ_elbjCQ_P0aDi8ah';

// Initialize Supabase Client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other scripts
window.supabaseClient = supabaseClient;

console.log('✅ Supabase client initialized');
