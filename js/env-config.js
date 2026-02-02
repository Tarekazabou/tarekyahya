/**
 * Environment Configuration Loader
 * Loads environment variables for browser and injects them into window object
 * This script should be loaded BEFORE other scripts that use supabaseClient
 */

(function() {
    // Check if running in development mode
    const isDevelopment = !window.location.hostname.includes('production') && 
                         !window.location.hostname.includes('primavet.com');
    
    // Initialize global environment object
    window.__ENV__ = window.__ENV__ || {};
    
    // Try to load from meta tags (set by server/build process)
    const supabaseUrlMeta = document.querySelector('meta[name="supabase-url"]');
    const supabaseKeyMeta = document.querySelector('meta[name="supabase-anon-key"]');
    
    if (supabaseUrlMeta && supabaseKeyMeta) {
        window.__ENV__.SUPABASE_URL = supabaseUrlMeta.getAttribute('content');
        window.__ENV__.SUPABASE_ANON_KEY = supabaseKeyMeta.getAttribute('content');
        console.log('✅ Loaded Supabase configuration from meta tags');
    }
    
    // If not set, try to fetch from config endpoint
    if (!window.__ENV__.SUPABASE_URL && !isDevelopment) {
        console.warn('⚠️ Supabase configuration not found. Make sure meta tags or config endpoint is available.');
    }
    
    // Export for debugging (remove in production)
    if (isDevelopment) {
        console.info('🔧 Environment Variables Available:', {
            SUPABASE_URL: window.__ENV__.SUPABASE_URL ? '***configured***' : '***missing***',
            SUPABASE_ANON_KEY: window.__ENV__.SUPABASE_ANON_KEY ? '***configured***' : '***missing***'
        });
    }
})();
