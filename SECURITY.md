# Security Best Practices

This document outlines security measures implemented and recommended for the Primavet website.

## Table of Contents
1. [Authentication & Authorization](#authentication--authorization)
2. [Data Protection](#data-protection)
3. [Input Validation](#input-validation)
4. [API Security](#api-security)
5. [Supabase Security](#supabase-security)
6. [Frontend Security](#frontend-security)
7. [Deployment Security](#deployment-security)
8. [Monitoring & Incident Response](#monitoring--incident-response)

## Authentication & Authorization

### Current Implementation ✅

- **Supabase Auth** for user authentication
- **Row Level Security (RLS)** on all database tables
- **Access levels** (3 = admin, 2 = premium, 1 = basic, 0 = free)
- **Admin-only routes** protected in `espace_admin.html`

### Best Practices

```javascript
// Always check authentication before sensitive operations
async function checkAuth() {
    const session = await AuthManager.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Verify admin access level
async function isAdmin(userId) {
    const { data: profile } = await supabaseClient
        .from('user_profiles')
        .select('access_level')
        .eq('id', userId)
        .single();
    
    return profile?.access_level === 3;
}
```

### Recommendations

- [ ] Implement multi-factor authentication (MFA)
- [ ] Add password strength requirements
- [ ] Set up session timeout (30 minutes of inactivity)
- [ ] Implement rate limiting on login attempts
- [ ] Add email verification for new accounts

## Data Protection

### Sensitive Data Handling

**Never store in code:**
```javascript
// ❌ BAD - API keys in code
const API_KEY = 'sk_live_1234567890abcdef';

// ✅ GOOD - Use environment variables
const API_KEY = import.meta.env.VITE_API_KEY;
```

**Never commit to Git:**
- API keys and secrets
- Database credentials
- Private keys
- User data

### Use .gitignore ✅

Already implemented:
```
.env
.env.local
.env.*.local
```

### Encryption

- **In Transit:** HTTPS/TLS (enabled via Cloudflare)
- **At Rest:** Supabase encrypts data at rest
- **Passwords:** Hashed by Supabase Auth (bcrypt)

## Input Validation

### Current Implementation ✅

Form validation in `js/form-handler.js`:
```javascript
// Email validation
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('Email invalide');
    return false;
}

// Phone validation
if (!/^\+?[\d\s\-()]+$/.test(phone)) {
    showError('Numéro de téléphone invalide');
    return false;
}
```

### Best Practices

```javascript
// Sanitize user input before displaying
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Example usage
const userInput = sanitizeHTML(formData.message);
document.getElementById('output').innerHTML = userInput;
```

### Validation Checklist

- [x] Email format validation
- [x] Phone number validation
- [x] Required field checks
- [x] File type validation (PDF for CVs)
- [ ] File size validation (max 5MB)
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention (sanitize all user inputs)

## API Security

### CSRF Protection ✅

Implemented in `admin.js`:
```javascript
const csrfToken = crypto.randomUUID();
sessionStorage.setItem('csrf_token', csrfToken);
```

### API Rate Limiting

**Supabase implements:**
- 60 requests per minute for anonymous users
- 200 requests per minute for authenticated users

**Recommendations:**
```javascript
// Implement client-side throttling
function throttle(func, delay) {
    let timeoutId;
    return function (...args) {
        if (!timeoutId) {
            func.apply(this, args);
            timeoutId = setTimeout(() => {
                timeoutId = null;
            }, delay);
        }
    };
}

// Use for search, filters, etc.
const throttledSearch = throttle(performSearch, 500);
```

### API Key Protection

```javascript
// ✅ GOOD - Use public anon key (safe for client-side)
const SUPABASE_ANON_KEY = 'eyJ...'; // Public key, safe to expose

// ❌ BAD - Never use service role key in frontend
// const SUPABASE_SERVICE_KEY = 'eyJ...'; // This bypasses RLS!
```

## Supabase Security

### Row Level Security (RLS) ✅

Already implemented on all tables. Example:

```sql
-- Users can only read their own data
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

-- Only admins can modify site config
CREATE POLICY "Admins can update config"
ON site_config FOR UPDATE
USING (is_admin());
```

### Database Security Checklist

- [x] RLS enabled on all tables
- [x] Proper foreign key constraints
- [x] Input validation via CHECK constraints
- [x] Admin-only policies for sensitive tables
- [ ] Regular security audits
- [ ] Database backups enabled

### Secure Queries

```javascript
// ✅ GOOD - Parameterized query (safe)
const { data } = await supabaseClient
    .from('products')
    .select('*')
    .eq('category', userInput)
    .single();

// ❌ BAD - SQL injection vulnerability
// const query = `SELECT * FROM products WHERE category = '${userInput}'`;
```

## Frontend Security

### Content Security Policy (CSP)

Add to HTML `<head>`:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; 
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
               font-src 'self' https://fonts.gstatic.com; 
               img-src 'self' data: https:; 
               connect-src 'self' https://*.supabase.co;">
```

### XSS Prevention

```javascript
// ✅ GOOD - Use textContent for user input
element.textContent = userInput;

// ❌ BAD - innerHTML with unsanitized input
// element.innerHTML = userInput; // XSS vulnerability!

// If you must use innerHTML, sanitize first
function sanitize(dirty) {
    const clean = DOMPurify.sanitize(dirty);
    return clean;
}
element.innerHTML = sanitize(userInput);
```

### Secure Cookie Settings

```javascript
// Set secure cookies
document.cookie = "session=abc123; Secure; HttpOnly; SameSite=Strict";
```

### HTTPS Enforcement

Cloudflare automatically enforces HTTPS, but add to pages:

```html
<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
```

## Deployment Security

### Cloudflare Pages Security Features ✅

- **Automatic HTTPS/SSL**
- **DDoS Protection**
- **Web Application Firewall (WAF)**
- **Bot Protection**

### Security Headers

Configure in Cloudflare dashboard:

```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### Environment Variables

Never commit secrets. Use Cloudflare Pages environment variables:

```bash
# Set in Cloudflare Dashboard → Pages → Settings → Environment Variables
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

## Monitoring & Incident Response

### Error Tracking

```javascript
// Log errors for monitoring
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Send to monitoring service (e.g., Sentry)
    reportError({
        message: event.error.message,
        stack: event.error.stack,
        timestamp: new Date().toISOString()
    });
});
```

### Audit Logging ✅

Already implemented in database:

```sql
-- Track admin actions
CREATE TABLE admin_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(50),
    resource_type VARCHAR(50),
    resource_id INT,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Security Checklist

#### Before Deployment
- [ ] Remove all console.log statements ✅ (Done)
- [ ] Update all dependencies
- [ ] Run security audit: `npm audit`
- [ ] Check for exposed secrets
- [ ] Test authentication flows
- [ ] Verify RLS policies

#### Regular Maintenance (Monthly)
- [ ] Review access logs
- [ ] Update dependencies
- [ ] Review user permissions
- [ ] Check for suspicious activity
- [ ] Backup database
- [ ] Test disaster recovery

#### Incident Response Plan
1. **Detect:** Monitor for anomalies
2. **Contain:** Disable affected accounts/features
3. **Investigate:** Review logs and determine scope
4. **Recover:** Fix vulnerability and restore service
5. **Learn:** Document incident and update procedures

## Common Vulnerabilities

### 1. XSS (Cross-Site Scripting)

**Risk:** Attacker injects malicious scripts
**Prevention:**
- Sanitize all user inputs ✅
- Use textContent instead of innerHTML
- Implement CSP headers

### 2. CSRF (Cross-Site Request Forgery)

**Risk:** Unauthorized commands from trusted user
**Prevention:**
- CSRF tokens ✅ (Implemented)
- SameSite cookie attribute
- Verify origin headers

### 3. SQL Injection

**Risk:** Malicious SQL queries
**Prevention:**
- Use parameterized queries ✅ (Supabase)
- Input validation ✅
- Least privilege database access

### 4. Authentication Issues

**Risk:** Unauthorized access
**Prevention:**
- Strong password policies
- Session management ✅
- MFA (recommended)
- Rate limiting on login

### 5. Sensitive Data Exposure

**Risk:** Leaking confidential information
**Prevention:**
- HTTPS/TLS ✅
- Secure storage ✅
- No secrets in code ✅
- Proper error messages (don't leak info)

## Security Tools

### Recommended Tools

1. **OWASP ZAP** - Security scanner
2. **Snyk** - Dependency vulnerability scanner
3. **Mozilla Observatory** - Website security analyzer
4. **SecurityHeaders.com** - Check HTTP headers

### Quick Security Scan

```bash
# Check dependencies for vulnerabilities
npm audit

# Fix automatically if possible
npm audit fix

# Check for outdated packages
npm outdated
```

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Cloudflare Security](https://developers.cloudflare.com/fundamentals/security/)

## Contact

For security concerns, contact: security@primavet.com

**Never** publicly disclose security vulnerabilities. Report them privately first.

---

**Last Updated:** 2024-02-01
**Next Review:** 2024-03-01
