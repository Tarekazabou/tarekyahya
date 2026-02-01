-- =====================================================
-- SUPABASE_SIMPLE_CATEGORIES.sql
-- Jack & Jones–style: categories normalized + facets JSONB
-- Much simpler, faster, no attribute pivot tables.
-- =====================================================

BEGIN;

-- =====================================================
-- 0) Helper: is_admin()
-- =====================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.uid() IS NOT NULL 
        AND (
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
            OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 1) CATEGORIES (Hierarchical navigation)
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    parent_id INT REFERENCES categories(id) ON DELETE SET NULL,
    icon VARCHAR(50) DEFAULT 'fa-folder',
    image_url TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    product_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- =====================================================
-- 2) PRODUCT_CATEGORIES (Many-to-Many)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    UNIQUE(product_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_pc_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_pc_category ON product_categories(category_id);

-- =====================================================
-- 3) ALTER PRODUCTS - Add denormalized facets + columns
-- =====================================================
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_original DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stock_status VARCHAR(20) DEFAULT 'in_stock',
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS facets JSONB DEFAULT '{}';

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_is_new ON products(is_new);
CREATE INDEX IF NOT EXISTS idx_products_is_on_sale ON products(is_on_sale);
CREATE INDEX IF NOT EXISTS idx_products_published ON products(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_facets ON products USING GIN(facets);

-- =====================================================
-- 4) RLS + Policies
-- =====================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Public read categories') THEN
        CREATE POLICY "Public read categories" ON categories FOR SELECT USING (is_active = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Admin all categories') THEN
        CREATE POLICY "Admin all categories" ON categories FOR ALL USING (is_admin()) WITH CHECK (is_admin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_categories' AND policyname = 'Public read product_categories') THEN
        CREATE POLICY "Public read product_categories" ON product_categories FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_categories' AND policyname = 'Admin all product_categories') THEN
        CREATE POLICY "Admin all product_categories" ON product_categories FOR ALL USING (is_admin()) WITH CHECK (is_admin());
    END IF;
END $$;

-- =====================================================
-- 5) RPC: get_categories_tree()
-- =====================================================
CREATE OR REPLACE FUNCTION get_categories_tree()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (
        WITH RECURSIVE cat_tree AS (
            SELECT id, name, slug, icon, image_url, sort_order, product_count,
                   0 as level, ARRAY[id] as path
            FROM categories
            WHERE parent_id IS NULL AND is_active = true
            
            UNION ALL
            
            SELECT c.id, c.name, c.slug, c.icon, c.image_url, c.sort_order, c.product_count,
                   ct.level + 1, ct.path || c.id
            FROM categories c
            JOIN cat_tree ct ON c.parent_id = ct.id
            WHERE c.is_active = true
        )
        SELECT COALESCE(JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'id', id, 'name', name, 'slug', slug, 'icon', icon,
                'image_url', image_url, 'product_count', product_count,
                'level', level, 'path', path
            ) ORDER BY path, sort_order
        ), '[]'::jsonb)
        FROM cat_tree
    );
END;
$$;

-- =====================================================
-- 6) RPC: get_products_faceted(...) – JSONB-based
-- =====================================================
CREATE OR REPLACE FUNCTION get_products_faceted(
    p_category_ids INT[] DEFAULT NULL,
    p_gender VARCHAR DEFAULT NULL,
    p_brands VARCHAR[] DEFAULT NULL,
    p_colors VARCHAR[] DEFAULT NULL,
    p_sizes VARCHAR[] DEFAULT NULL,
    p_materials VARCHAR[] DEFAULT NULL,
    p_price_min DECIMAL DEFAULT NULL,
    p_price_max DECIMAL DEFAULT NULL,
    p_is_new BOOLEAN DEFAULT NULL,
    p_is_on_sale BOOLEAN DEFAULT NULL,
    p_search_term VARCHAR DEFAULT NULL,
    p_sort_by VARCHAR DEFAULT 'newest',
    p_page INT DEFAULT 1,
    p_per_page INT DEFAULT 12
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_offset INT := (p_page - 1) * p_per_page;
    v_products JSONB;
    v_total INT;
    v_facets JSONB;
BEGIN
    -- Filtered products CTE
    WITH filtered AS (
        SELECT DISTINCT p.*
        FROM products p
        LEFT JOIN product_categories pc ON p.id = pc.product_id
        WHERE 1=1
          AND (p_category_ids IS NULL OR pc.category_id = ANY(p_category_ids))
          AND (p_gender IS NULL OR p.gender = p_gender OR p.category = p_gender)
          AND (p_brands IS NULL OR p.brand = ANY(p_brands))
          AND (p_colors IS NULL OR p.facets->'color' ?| p_colors)
          AND (p_sizes IS NULL OR p.facets->'size' ?| p_sizes)
          AND (p_materials IS NULL OR p.facets->>'material' = ANY(p_materials))
          AND (p_price_min IS NULL OR p.price >= p_price_min)
          AND (p_price_max IS NULL OR p.price <= p_price_max)
          AND (p_is_new IS NULL OR p.is_new = p_is_new)
          AND (p_is_on_sale IS NULL OR p.is_on_sale = p_is_on_sale)
          AND (p_search_term IS NULL OR 
               p.name ILIKE '%' || p_search_term || '%' OR 
               p.description ILIKE '%' || p_search_term || '%' OR
               p.brand ILIKE '%' || p_search_term || '%')
    ),
    sorted AS (
        SELECT * FROM filtered
        ORDER BY
            CASE WHEN p_sort_by = 'newest' THEN COALESCE(published_at, created_at) END DESC NULLS LAST,
            CASE WHEN p_sort_by = 'price_asc' THEN COALESCE(price, 999999) END ASC,
            CASE WHEN p_sort_by = 'price_desc' THEN COALESCE(price, 0) END DESC,
            CASE WHEN p_sort_by = 'name' THEN name END ASC,
            CASE WHEN p_sort_by = 'featured' THEN is_featured END DESC,
            sort_order ASC, id ASC
    ),
    paginated AS (
        SELECT * FROM sorted LIMIT p_per_page OFFSET v_offset
    )
    SELECT 
        COALESCE(JSONB_AGG(ROW_TO_JSON(paginated)::jsonb), '[]'::jsonb),
        (SELECT COUNT(*) FROM filtered)
    INTO v_products, v_total
    FROM paginated;

    -- Build facets from base products (search only, no other filters)
    WITH base AS (
        SELECT * FROM products
        WHERE p_search_term IS NULL OR 
              name ILIKE '%' || p_search_term || '%' OR 
              description ILIKE '%' || p_search_term || '%'
    )
    SELECT JSONB_BUILD_OBJECT(
        'categories', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
                'id', c.id, 'name', c.name, 'slug', c.slug,
                'parent_id', c.parent_id, 'count', COALESCE(cnt, 0)
            ) ORDER BY c.sort_order), '[]'::jsonb)
            FROM categories c
            LEFT JOIN (
                SELECT pc.category_id, COUNT(DISTINCT b.id) as cnt
                FROM base b JOIN product_categories pc ON b.id = pc.product_id
                GROUP BY pc.category_id
            ) cc ON c.id = cc.category_id
            WHERE c.is_active = true
        ),
        'genders', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('value', g, 'count', cnt)), '[]'::jsonb)
            FROM (SELECT COALESCE(gender, category) g, COUNT(*) cnt FROM base WHERE COALESCE(gender, category) IS NOT NULL GROUP BY 1) x
        ),
        'brands', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('value', brand, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
            FROM (SELECT brand, COUNT(*) cnt FROM base WHERE brand IS NOT NULL GROUP BY brand) x
        ),
        'colors', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('value', color, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
            FROM (
                SELECT jsonb_array_elements_text(facets->'color') AS color, COUNT(*) cnt
                FROM base WHERE facets->'color' IS NOT NULL GROUP BY 1
            ) x
        ),
        'sizes', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('value', sz, 'count', cnt)), '[]'::jsonb)
            FROM (
                SELECT jsonb_array_elements_text(facets->'size') AS sz, COUNT(*) cnt
                FROM base WHERE facets->'size' IS NOT NULL GROUP BY 1
            ) x
        ),
        'materials', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('value', mat, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
            FROM (SELECT facets->>'material' AS mat, COUNT(*) cnt FROM base WHERE facets->>'material' IS NOT NULL GROUP BY 1) x
        ),
        'price_range', (
            SELECT JSONB_BUILD_OBJECT('min', COALESCE(MIN(price),0), 'max', COALESCE(MAX(price),1000))
            FROM base WHERE price IS NOT NULL
        )
    ) INTO v_facets;

    RETURN JSONB_BUILD_OBJECT(
        'items', v_products,
        'total_count', v_total,
        'total_pages', CEIL(v_total::decimal / p_per_page),
        'current_page', p_page,
        'per_page', p_per_page,
        'facets', v_facets
    );
END;
$$;

-- =====================================================
-- 7) Trigger: update category product_count
-- =====================================================
CREATE OR REPLACE FUNCTION update_category_product_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE categories SET product_count = (
        SELECT COUNT(DISTINCT product_id) FROM product_categories WHERE category_id = categories.id
    )
    WHERE id IN (
        SELECT category_id FROM product_categories 
        WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_category_count ON product_categories;
CREATE TRIGGER trg_category_count
AFTER INSERT OR UPDATE OR DELETE ON product_categories
FOR EACH ROW EXECUTE FUNCTION update_category_product_count();

-- =====================================================
-- 8) Seed: categories
-- =====================================================
INSERT INTO categories (name, slug, icon, sort_order, parent_id) VALUES
('Vêtements', 'vetements', 'fa-tshirt', 1, NULL),
('Accessoires', 'accessoires', 'fa-glasses', 2, NULL),
('Professionnel', 'professionnel', 'fa-briefcase', 3, NULL)
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE vid INT; aid INT; pid INT;
BEGIN
    SELECT id INTO vid FROM categories WHERE slug = 'vetements';
    SELECT id INTO aid FROM categories WHERE slug = 'accessoires';
    SELECT id INTO pid FROM categories WHERE slug = 'professionnel';

    INSERT INTO categories (name, slug, icon, sort_order, parent_id) VALUES
    ('T-shirts', 't-shirts', 'fa-tshirt', 1, vid),
    ('Chemises', 'chemises', 'fa-shirt', 2, vid),
    ('Pantalons', 'pantalons', 'fa-socks', 3, vid),
    ('Jeans', 'jeans', 'fa-jeans', 4, vid),
    ('Vestes', 'vestes', 'fa-vest', 5, vid),
    ('Pulls', 'pulls', 'fa-mitten', 6, vid)
    ON CONFLICT (slug) DO NOTHING;

    INSERT INTO categories (name, slug, icon, sort_order, parent_id) VALUES
    ('Ceintures', 'ceintures', 'fa-ring', 1, aid),
    ('Écharpes', 'echarpes', 'fa-scarf', 2, aid),
    ('Chapeaux', 'chapeaux', 'fa-hat-cowboy', 3, aid)
    ON CONFLICT (slug) DO NOTHING;

    INSERT INTO categories (name, slug, icon, sort_order, parent_id) VALUES
    ('Uniformes', 'uniformes', 'fa-user-tie', 1, pid),
    ('Vêtements de travail', 'vetements-travail', 'fa-hard-hat', 2, pid)
    ON CONFLICT (slug) DO NOTHING;
END $$;

-- =====================================================
-- 9) Migration: map legacy category + set facets example
-- =====================================================
INSERT INTO product_categories (product_id, category_id, is_primary)
SELECT p.id, c.id, true
FROM products p
JOIN categories c ON (
    (p.category = 'homme' AND c.slug = 'vetements') OR
    (p.category = 'femme' AND c.slug = 'vetements') OR
    (p.category = 'professionnel' AND c.slug = 'professionnel') OR
    (p.category = 'accessoires' AND c.slug = 'accessoires')
)
WHERE p.category IS NOT NULL
ON CONFLICT DO NOTHING;

UPDATE products SET gender = category WHERE category IN ('homme','femme') AND gender IS NULL;

-- Example: set facets JSONB on existing products (customize as needed)
-- UPDATE products SET facets = '{"color":["noir"],"size":["m","l"],"material":"coton","fit":"regular"}' WHERE id = 1;

COMMIT;

-- =====================================================
-- DONE! 
-- Tables: categories, product_categories
-- Products: + price, brand, gender, is_new, is_on_sale, facets JSONB
-- RPCs: get_categories_tree(), get_products_faceted(...)
-- =====================================================
