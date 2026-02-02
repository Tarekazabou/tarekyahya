# Environment Variables Configuration Guide

## Overview
The application uses environment variables for sensitive configuration like Supabase credentials. This ensures secrets are not hardcoded in the repository.

## Development Setup

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Fill in Your Supabase Credentials
Edit `.env` and add your Supabase project details:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Production Deployment

### Method 1: Meta Tags (Recommended for HTML-only sites)
Add these meta tags to `<head>` in `espace_admin.html`, `collections.html`, and other pages that need Supabase:

```html
<!-- Supabase Configuration (set by build process or server) -->
<meta name="supabase-url" content="https://your-production-project.supabase.co">
<meta name="supabase-anon-key" content="your-production-anon-key">
```

### Method 2: Server-Side Injection (Node.js/Express)
If using a Node server, inject environment variables before serving HTML:

```javascript
// server.js
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

app.get('/', (req, res) => {
    let html = fs.readFileSync('./espace_admin.html', 'utf8');
    
    // Inject environment variables
    html = html.replace(
        '</head>',
        `<script>
            window.__ENV__ = {
                SUPABASE_URL: '${supabaseUrl}',
                SUPABASE_ANON_KEY: '${supabaseAnonKey}'
            };
        </script>
        </head>`
    );
    
    res.send(html);
});
```

### Method 3: Build Process (Vite/Webpack)
If using a build tool, environment variables are automatically loaded:

```bash
# Build with environment variables
SUPABASE_URL=https://... SUPABASE_ANON_KEY=... npm run build
```

## Hosting Platforms

### Netlify
Set environment variables in Netlify dashboard:
- Build & Deploy > Environment
- Add `SUPABASE_URL` and `SUPABASE_ANON_KEY`

Then inject in `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  
[build.environment]
  SUPABASE_URL = "https://your-project.supabase.co"
  SUPABASE_ANON_KEY = "your-key"
```

### Vercel
Set environment variables in Vercel dashboard:
- Settings > Environment Variables
- Add `SUPABASE_URL` and `SUPABASE_ANON_KEY`

### GitHub Pages
Since GitHub Pages doesn't support environment variables directly, use meta tags method or proxy through a backend service.

## Security Best Practices

1. **Never commit .env file** - Add to .gitignore
2. **Use Supabase RLS (Row Level Security)** - Restrict database access at the policy level
3. **Anon key only** - The anonymous key has limited permissions, never expose service role key
4. **HTTPS only** - Always use HTTPS in production
5. **Rotate keys regularly** - Regenerate keys if compromised

## Troubleshooting

### "Using hardcoded Supabase config" warning
This means environment variables are not configured. Follow the deployment method for your hosting platform.

### Supabase connection fails
1. Verify `SUPABASE_URL` is correct (should end with `.supabase.co`)
2. Check `SUPABASE_ANON_KEY` is valid
3. Ensure Supabase project is not paused
4. Check Supabase RLS policies allow your user role

### CORS errors
Add your domain to Supabase dashboard:
- Project Settings > API > CORS allowed domains

## Testing Environment Variables

Open browser console and run:
```javascript
console.log(window.__ENV__);
```

Should show:
```javascript
{
  SUPABASE_URL: "https://...",
  SUPABASE_ANON_KEY: "..."
}
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Your Supabase project URL from Project Settings > API |
| `SUPABASE_ANON_KEY` | Yes | Anonymous API key from Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Service role key (backend only, never expose) |
| `NODE_ENV` | No | Set to 'production' in production |
