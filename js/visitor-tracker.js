/**
 * Visitor Tracking System
 * Primavet - Analytics & Page View Tracking
 * 
 * Include this script on all public pages to track visitors
 */

/* global supabaseClient */

const VisitorTracker = {
  // Configuration
  config: {
    storageKey: 'primavet_visitor_id',
    sessionKey: 'primavet_session_id',
    sessionStartKey: 'primavet_session_start',
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    lastActivityKey: 'primavet_last_activity',
    trackingEnabled: true,
  },

  /**
   * Initialize the visitor tracker
   */
  async init() {
    if (!this.config.trackingEnabled) return;

    // Wait for supabaseClient to be available (max ~2s)
    let retries = 0;
    const maxRetries = 20;
    while ((typeof supabaseClient === 'undefined' || !supabaseClient) && retries < maxRetries) {
      await new Promise((r) => setTimeout(r, 100));
      retries++;
    }

    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
      console.warn('VisitorTracker: supabaseClient not available');
      return;
    }

    try {
      const visitorData = this.collectVisitorData();
      await this.trackPageView(visitorData);
      this.setupActivityTracking();
    } catch (error) {
      console.error('VisitorTracker: Error initializing', error);
    }
  },

  /**
   * Get or create a unique visitor ID
   */
  getVisitorId() {
    try {
      let visitorId = localStorage.getItem(this.config.storageKey);
      if (!visitorId) {
        visitorId = this.generateUUID();
        localStorage.setItem(this.config.storageKey, visitorId);
      }
      return visitorId;
    } catch {
      // Fallback if storage is blocked
      return this.generateUUID();
    }
  },

  /**
   * Get or create a session ID
   */
  getSessionId() {
    const now = Date.now();

    try {
      const lastActivity = sessionStorage.getItem(this.config.lastActivityKey);

      // Expire session if inactive
      if (lastActivity && now - Number(lastActivity) > this.config.sessionTimeout) {
        sessionStorage.removeItem(this.config.sessionKey);
        sessionStorage.removeItem(this.config.sessionStartKey);
      }

      let sessionId = sessionStorage.getItem(this.config.sessionKey);

      if (!sessionId) {
        sessionId = this.generateUUID();
        sessionStorage.setItem(this.config.sessionKey, sessionId);
        sessionStorage.setItem(this.config.sessionStartKey, now.toString());
      }

      sessionStorage.setItem(this.config.lastActivityKey, now.toString());
      return sessionId;
    } catch {
      return this.generateUUID();
    }
  },

  /**
   * Check if this is a new visitor
   */
  isNewVisitor() {
    try {
      const key = `${this.config.storageKey}_visited`;
      const hasVisited = localStorage.getItem(key);
      if (!hasVisited) {
        localStorage.setItem(key, 'true');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  /**
   * Detect if user is on mobile device
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  },

  /**
   * Collect visitor data
   */
  collectVisitorData() {
    return {
      visitor_id: this.getVisitorId(),
      session_id: this.getSessionId(),
      page_url: window.location.href,
      page_path: window.location.pathname,
      page_title: document.title,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      language: navigator.language || null,
      is_mobile: this.isMobile(),
      is_new_visitor: this.isNewVisitor(),
      created_at: new Date().toISOString(),
    };
  },

  /**
   * Track a page view
   */
  async trackPageView(data) {
    try {
      if (typeof supabaseClient === 'undefined' || !supabaseClient) return;

      const { error } = await supabaseClient.from('page_views').insert([data]);
      if (error) {
        console.warn('VisitorTracker: Failed to track page view', error.message);
      }
    } catch (error) {
      console.warn('VisitorTracker: Error tracking page view', error);
    }
  },

  /**
   * Track custom events
   */
  async trackEvent(eventName, eventData = {}) {
    try {
      if (typeof supabaseClient === 'undefined' || !supabaseClient) return;

      const data = {
        visitor_id: this.getVisitorId(),
        session_id: this.getSessionId(),
        page_url: window.location.href,
        page_path: window.location.pathname,
        page_title: document.title,
        event_name: eventName,
        event_data: eventData,
        user_agent: navigator.userAgent,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        language: navigator.language || null,
        is_mobile: this.isMobile(),
        created_at: new Date().toISOString(),
      };

      const { error } = await supabaseClient.from('events').insert([data]);
      if (error) {
        console.warn('VisitorTracker: Failed to track event', error.message);
      }
    } catch (error) {
      console.warn('VisitorTracker: Error tracking event', error);
    }
  },

  /**
   * Setup activity tracking for session duration
   */
  setupActivityTracking() {
    const updateActivity = () => {
      try {
        sessionStorage.setItem(this.config.lastActivityKey, Date.now().toString());
      } catch {}
    };

    document.addEventListener('click', updateActivity, { passive: true });
    document.addEventListener('scroll', updateActivity, { passive: true });
    document.addEventListener('keydown', updateActivity, { passive: true });

    window.addEventListener('beforeunload', () => {
      try {
        const start = sessionStorage.getItem(this.config.sessionStartKey);
        if (start) {
          const durationMs = Date.now() - Number(start);
          // Optionally send durationMs to backend
        }
      } catch {}
    });
  },

  /**
   * Generate a UUID v4
   */
  generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => VisitorTracker.init());
} else {
  setTimeout(() => VisitorTracker.init(), 100);
}

// Export for manual/CommonJS use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VisitorTracker;
}
