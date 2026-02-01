# Performance Optimization Guide

This document outlines best practices and actionable steps to optimize the Primavet website for better performance, faster load times, and improved user experience.

## Current Status

### Assets Analysis
- **Total images:** 6 PNG files in `assets/` directory
- **Total size:** ~3.2 MB uncompressed
- **Largest file:** Gemini_Generated_Image_2t7y2l2t7y2l2t7y.png (865 KB)
- **HTML/CSS/JS:** ~23,700 lines of code

## 1. Image Optimization

### Priority: HIGH

Current images are not optimized for web use. Here's how to optimize them:

#### Using Online Tools (Recommended)

1. **TinyPNG** (https://tinypng.com)
   - Drag and drop PNG files
   - Reduces size by 50-80%
   - Maintains visual quality
   - Free for up to 20 images at a time

2. **Squoosh** (https://squoosh.app)
   - Advanced web-based image optimizer
   - Choose WebP format for best results
   - Adjust quality slider (80-85% recommended)

3. **ImageOptim** (https://imageoptim.com) - Mac only
   - Desktop app for bulk optimization
   - Lossless compression

#### Using Command Line Tools

```bash
# Install optipng (Ubuntu/Debian)
sudo apt install optipng

# Optimize PNG files
cd assets/
optipng -o7 *.png

# Or use pngquant for lossy compression (better results)
sudo apt install pngquant
pngquant --quality=80-90 --ext .png --force *.png
```

#### Target Sizes
- **Logos:** < 50 KB
- **Backgrounds:** < 200 KB
- **Product images:** < 150 KB
- **Hero images:** < 300 KB

### Image Format Recommendations

| Use Case | Format | Why |
|----------|--------|-----|
| Photos/Complex images | WebP | 30% smaller than JPEG |
| Logos/Icons | SVG | Scalable, tiny size |
| Simple graphics | PNG | Transparency support |
| Animated content | WebP/GIF | WebP preferred |

#### Fallback for WebP

```html
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="Description">
</picture>
```

## 2. Code Optimization

### CSS Optimization

#### Minification
```bash
# Install csso-cli
npm install -g csso-cli

# Minify CSS files
csso css/styles.css -o css/styles.min.css
csso css/admin.css -o css/admin.min.css
csso css/collections.css -o css/collections.min.css
```

#### Remove Unused CSS
- Use Chrome DevTools Coverage tab
- Remove unused vendor prefixes
- Consider Critical CSS for above-the-fold content

### JavaScript Optimization

#### Minification
```bash
# Install terser
npm install -g terser

# Minify JS files
terser js/main.js -c -m -o js/main.min.js
terser js/admin.js -c -m -o js/admin.min.js
# Repeat for other JS files
```

#### Best Practices
- ✅ Use async/defer for script tags
- ✅ Load scripts at the end of body
- ✅ Minimize DOM manipulation
- ✅ Use event delegation
- ✅ Debounce scroll/resize handlers

### HTML Optimization

- Remove extra whitespace and comments
- Use semantic HTML
- Minimize inline styles
- Defer non-critical CSS

## 3. Loading Optimization

### Lazy Loading Images

```html
<!-- Add loading="lazy" to images -->
<img src="image.jpg" loading="lazy" alt="Description">
```

### Preload Critical Resources

```html
<head>
  <!-- Preload critical CSS -->
  <link rel="preload" href="css/styles.css" as="style">
  
  <!-- Preload critical fonts -->
  <link rel="preload" href="fonts/poppins.woff2" as="font" type="font/woff2" crossorigin>
  
  <!-- Preconnect to external domains -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
</head>
```

### Defer Non-Critical CSS

```html
<link rel="stylesheet" href="css/styles.css">
<link rel="stylesheet" href="css/non-critical.css" media="print" onload="this.media='all'">
```

## 4. Browser Caching

### Wrangler Configuration (Cloudflare Pages)

Update `wrangler.jsonc`:

```json
{
  "name": "primavet-website",
  "assets": {
    "directory": ".",
    "binding": "ASSETS",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "404-page"
  },
  "compatibility_date": "2024-12-23",
  "observability": {
    "enabled": true
  },
  "routes": [
    {
      "pattern": "*.js",
      "cache_control": {
        "browser_ttl": 31536000,
        "edge_ttl": 31536000
      }
    },
    {
      "pattern": "*.css",
      "cache_control": {
        "browser_ttl": 31536000,
        "edge_ttl": 31536000
      }
    },
    {
      "pattern": "assets/*",
      "cache_control": {
        "browser_ttl": 31536000,
        "edge_ttl": 31536000
      }
    }
  ]
}
```

### .htaccess (If using Apache)

```apache
# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Enable browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

## 5. Performance Monitoring

### Measure Performance

```bash
# Using Lighthouse (Chrome DevTools)
# Open DevTools → Lighthouse → Generate Report

# Key metrics to monitor:
# - First Contentful Paint (FCP): < 1.8s
# - Largest Contentful Paint (LCP): < 2.5s
# - Time to Interactive (TTI): < 3.8s
# - Cumulative Layout Shift (CLS): < 0.1
# - Total Blocking Time (TBT): < 300ms
```

### Online Tools

1. **PageSpeed Insights** - https://pagespeed.web.dev/
2. **GTmetrix** - https://gtmetrix.com/
3. **WebPageTest** - https://www.webpagetest.org/
4. **Pingdom** - https://tools.pingdom.com/

## 6. Database Optimization

### Supabase Best Practices

```sql
-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_news_created ON news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor ON page_views(visitor_id);

-- Use pagination in queries
SELECT * FROM products 
ORDER BY created_at DESC 
LIMIT 12 OFFSET 0;

-- Use RPC functions for complex queries
-- (Already implemented in data-service.js)
```

### Query Optimization

- Use `select()` with specific columns instead of `*`
- Implement pagination for large datasets
- Use database-level filtering instead of client-side
- Cache frequently accessed data

## 7. CDN Usage

### Cloudflare Pages (Current Setup)

Already configured via Wrangler. Benefits:
- Global edge network
- Automatic SSL
- DDoS protection
- Automatic minification (optional)
- HTTP/2 and HTTP/3

### External Libraries

Use CDN for external libraries:

```html
<!-- Font Awesome -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-..." crossorigin="anonymous">

<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" integrity="sha512-..." crossorigin="anonymous"></script>
```

## 8. Implementation Checklist

### Immediate Actions (Do Now)
- [ ] Optimize all images in `assets/` directory
- [ ] Add `loading="lazy"` to images below the fold
- [ ] Minify CSS and JavaScript files
- [ ] Add `defer` to non-critical scripts

### Short Term (This Week)
- [ ] Implement browser caching headers
- [ ] Convert large images to WebP format
- [ ] Add preload for critical resources
- [ ] Test with Lighthouse and fix major issues

### Medium Term (This Month)
- [ ] Set up performance monitoring
- [ ] Implement service worker for offline support
- [ ] Optimize database queries
- [ ] Add resource hints (dns-prefetch, preconnect)

### Long Term (Ongoing)
- [ ] Regular performance audits
- [ ] Monitor and optimize Core Web Vitals
- [ ] A/B test performance improvements
- [ ] Keep dependencies updated

## 9. Expected Results

After implementing these optimizations:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Page Load Time | 3-5s | 1-2s | 50-60% faster |
| Image Sizes | 3.2 MB | 0.8 MB | 75% reduction |
| Total Page Size | 4-5 MB | 1.5-2 MB | 60% reduction |
| Lighthouse Score | 60-70 | 90-95 | Significant improvement |

## 10. Resources

- [Web.dev Performance](https://web.dev/performance/)
- [MDN Web Performance](https://developer.mozilla.org/en-US/docs/Web/Performance)
- [Cloudflare Cache Rules](https://developers.cloudflare.com/cache/)
- [Supabase Performance Tips](https://supabase.com/docs/guides/platform/performance)

---

**Note:** Always test optimizations in a development environment before applying to production. Keep backups of original files.
