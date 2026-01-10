/* global supabaseClient */

const VisitorTracker = {
  config: {
    storageKey: 'primavet_visitor_id',
    sessionKey: 'primavet_session_id',
    sessionStartKey: 'primavet_session_start',
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    lastActivityKey: 'primavet_last_activity',
    trackingEnabled: true,
  },

  async init() {
    if (!this.config.trackingEnabled) return;

    let retries = 0;
    while (!window.supabaseClient && retries < 20) {
      await new Promise((r) => setTimeout(r, 100));
      retries++;
    }

    if (!window.supabaseClient) {
      console.warn('VisitorTracker: supabaseClient not available');
      return;
    }

    const data = this.collectVisitorData();
    await this.trackPageView(data);
    this.setupActivityTracking();
  },

  /** VISITOR */
  getVisitor() {
    try {
      let visitorId = localStorage.getItem(this.config.storageKey);
      let isNew = false;

      if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem(this.config.storageKey, visitorId);
        isNew = true;
      }

      return { visitorId, isNew };
    } catch {
      return { visitorId: crypto.randomUUID(), isNew: true };
    }
  },

  /** SESSION */
  getSessionId() {
    const now = Date.now();

    try {
      const lastActivity = sessionStorage.getItem(this.config.lastActivityKey);
      if (lastActivity && now - Number(lastActivity) > this.config.sessionTimeout) {
        sessionStorage.clear();
      }

      let sessionId = sessionStorage.getItem(this.config.sessionKey);
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem(this.config.sessionKey, sessionId);
        sessionStorage.setItem(this.config.sessionStartKey, now.toString());
      }

      sessionStorage.setItem(this.config.lastActivityKey, now.toString());
      return sessionId;
    } catch {
      return crypto.randomUUID();
    }
  },

  isMobile() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
  },

  collectVisitorData() {
    const { visitorId, isNew } = this.getVisitor();

    return {
      visitor_id: visitorId,
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
      is_new_visitor: isNew,
      created_at: new Date().toISOString(),
    };
  },

  async trackPageView(data) {
    const { error } = await supabaseClient.from('page_views').insert(data);
    if (error) console.warn('Track failed', error.message);
  },

  setupActivityTracking() {
    const update = () => {
      try {
        sessionStorage.setItem(this.config.lastActivityKey, Date.now().toString());
      } catch {}
    };

    ['click', 'scroll', 'keydown'].forEach((e) =>
      document.addEventListener(e, update, { passive: true })
    );
  },
};

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', () => VisitorTracker.init())
  : VisitorTracker.init();
