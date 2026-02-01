# Database Schema Documentation

This directory contains SQL schema files for the Primavet project using Supabase (PostgreSQL).

## Schema Files

### 1. `schema.sql` (Main Schema - RECOMMENDED)
**Primary database schema for the application.**

Contains:
- Page views and visitor tracking tables
- Site configuration
- Products, categories, and inventory management
- News, jobs, and content management
- Contact forms, quotes, and orders
- Admin user management with access levels
- Row Level Security (RLS) policies

**Usage:** Run this file first when setting up a new Supabase project.

### 2. `CONTENT_RESTRICTION_SCHEMA.sql`
**Content restriction and access control features.**

Contains:
- Content restriction rules and logs
- User access level management
- Premium content gating system

**Usage:** Run after `schema.sql` if you need content restriction features.

### 3. Categories Schema Files (Choose ONE)

#### Option A: `SUPABASE_RUN_THIS_CATEGORIES.sql` (Full Featured)
- Complete hierarchical categories system
- Separate attribute tables (colors, sizes, brands)
- Faceted filtering with pivot tables
- Advanced RPC functions for filtering
- Best for: Large catalogs with complex filtering needs

#### Option B: `SUPABASE_SIMPLE_CATEGORIES.sql` (Simplified)
- Hierarchical categories
- JSONB-based attributes (simpler structure)
- Faster and easier to maintain
- Best for: Medium-sized catalogs

#### Option C: `categories_schema.sql` (Legacy)
- Original category implementation
- Similar to Option A but older version
- **Note:** This is kept for reference only

**Recommendation:** Use `SUPABASE_SIMPLE_CATEGORIES.sql` for most projects unless you need the advanced features of `SUPABASE_RUN_THIS_CATEGORIES.sql`.

## Installation Order

1. **Fresh Installation:**
   ```sql
   -- Step 1: Core schema
   Run schema.sql
   
   -- Step 2: Content restrictions (optional)
   Run CONTENT_RESTRICTION_SCHEMA.sql
   
   -- Step 3: Categories (choose ONE)
   Run SUPABASE_SIMPLE_CATEGORIES.sql
   -- OR
   Run SUPABASE_RUN_THIS_CATEGORIES.sql
   ```

2. **Updating Existing Database:**
   - Review your current schema first
   - Test in a development environment
   - Make backups before running any schema changes

## Key Features

### Security
- Row Level Security (RLS) enabled on all tables
- Admin-only access for sensitive operations
- User role-based access control

### Performance
- Proper indexes on frequently queried columns
- Denormalized counts for quick aggregation
- Optimized RPC functions for complex queries

### Data Integrity
- Foreign key constraints
- Default values and NOT NULL constraints
- Proper cascade rules on deletes

## Environment Variables

Make sure to set up your Supabase connection in `js/supabase-client.js`:
```javascript
const SUPABASE_URL = 'your-project-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

## Maintenance

### Regular Tasks
- Monitor table sizes and indexes
- Review RLS policies for security
- Backup database regularly
- Update product counts periodically

### Performance Tips
- Use the provided RPC functions for complex queries
- Keep JSONB fields organized and indexed
- Archive old records (page_views, logs) periodically

## Support

For questions or issues:
1. Check the main DOCUMENTATION.md
2. Review PLAN_CATEGORIES.md for categories implementation details
3. Consult Supabase documentation for PostgreSQL-specific features
