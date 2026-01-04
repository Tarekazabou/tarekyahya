/**
 * Supabase Client Configuration
 * Primavet Website
 * 
 * SECURITY NOTE: In production, these keys should be loaded from environment
 * variables via a build process or server-side proxy. The anon key provides
 * limited public access - RLS policies must be properly configured.
 */

// Configuration - In production, load from environment or config endpoint
// For local development, you can use a .env file with a build tool like Vite
const getConfig = () => {
    // Check for environment-injected config (from build process)
    if (window.__SUPABASE_CONFIG__) {
        return window.__SUPABASE_CONFIG__;
    }
    
    // Fallback for development - REMOVE IN PRODUCTION
    console.warn('⚠️ Using hardcoded Supabase config. Configure environment variables for production.');
    return {
        url: 'https://sqjtchehpuwiwyqkyxft.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxanRjaGVocHV3aXd5cWt5eGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODUzMzEsImV4cCI6MjA4MjY2MTMzMX0.7izZxD7jx5zDkAiL2CMt2v_7WGvJnApPgqz8mjlkZYw'
    };
};

const config = getConfig();

// Initialize Supabase Client with additional security options
const supabaseClient = supabase.createClient(config.url, config.anonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    global: {
        headers: {
            'X-Client-Info': 'primavet-web'
        }
    }
});

// Session management utilities
const AuthManager = {
    /**
     * Get current session
     */
    async getSession() {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) {
            console.error('Session error:', error);
            return null;
        }
        return session;
    },

    /**
     * Check if user is authenticated
     */
    async isAuthenticated() {
        const session = await this.getSession();
        return !!session;
    },

    /**
     * Check if user has admin role (requires custom claims or role table)
     */
    async isAdmin() {
        const session = await this.getSession();
        if (!session) return false;
        
        // Check user metadata for admin role
        const user = session.user;
        return user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin';
    },

    /**
     * Sign in with email/password
     */
    async signIn(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    },

    /**
     * Sign out
     */
    async signOut() {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
    },

    /**
     * Listen for auth state changes
     */
    onAuthStateChange(callback) {
        return supabaseClient.auth.onAuthStateChange(callback);
    }
};

// Rate limiting for client-side requests (basic protection)
const RateLimiter = {
    requests: new Map(),
    maxRequests: 100,
    windowMs: 60000, // 1 minute

    canMakeRequest(key = 'default') {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        
        if (!this.requests.has(key)) {
            this.requests.set(key, []);
        }
        
        const timestamps = this.requests.get(key).filter(t => t > windowStart);
        this.requests.set(key, timestamps);
        
        if (timestamps.length >= this.maxRequests) {
            console.warn('Rate limit exceeded');
            return false;
        }
        
        timestamps.push(now);
        return true;
    }
};

// Export for use in other scripts
window.supabaseClient = supabaseClient;
window.AuthManager = AuthManager;
window.RateLimiter = RateLimiter;

console.log('✅ Supabase client initialized with security enhancements');
