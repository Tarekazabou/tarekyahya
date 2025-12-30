/**
 * Supabase Client Configuration
 * Primavet Website
 */

// Supabase Configuration
const SUPABASE_URL = 'https://sqjtchehpuwiwyqkyxft.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxanRjaGVocHV3aXd5cWt5eGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODUzMzEsImV4cCI6MjA4MjY2MTMzMX0.7izZxD7jx5zDkAiL2CMt2v_7WGvJnApPgqz8mjlkZYw';

// Initialize Supabase Client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other scripts
window.supabaseClient = supabaseClient;

console.log('✅ Supabase client initialized');
