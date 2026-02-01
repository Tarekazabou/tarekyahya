-- =====================================================
-- SUPABASE_RUN_THIS_CATEGORIES.sql
-- Copy/paste the whole file into Supabase SQL Editor and run.
-- Adds: categories + faceted filters (attributes) + RPC + RLS.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE / ON CONFLICT).
-- =====================================================

BEGIN;

-- =====================================================
-- 0) Helper: is_admin()
-- (This exists in your base schema, but included here so this file is standalone.)
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
-- 1) CATEGORIES TABLE (Hierarchical)
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INT REFERENCES categories(id) ON DELETE SET NULL,
    icon VARCHAR(50) DEFAULT 'fa-folder',
    image_url TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    product_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- =====================================================
-- 2) PRODUCT_CATEGORIES (Many-to-Many Pivot)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);

-- =====================================================
-- 3) ATTRIBUTES (Facets)
-- =====================================================
CREATE TABLE IF NOT EXISTS attributes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    display_type VARCHAR(50) DEFAULT 'checkbox',
    sort_order INT DEFAULT 0,
    is_filterable BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 4) ATTRIBUTE_VALUES
-- =====================================================
CREATE TABLE IF NOT EXISTS attribute_values (
    id SERIAL PRIMARY KEY,
    attribute_id INT NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
    value VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    color_code VARCHAR(20),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(attribute_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_attribute_values_attribute ON attribute_values(attribute_id);

-- =====================================================
-- 5) PRODUCT_ATTRIBUTE_VALUES (pivot)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_attribute_values (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_value_id INT NOT NULL REFERENCES attribute_values(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, attribute_value_id)
);

CREATE INDEX IF NOT EXISTS idx_pav_product ON product_attribute_values(product_id);
CREATE INDEX IF NOT EXISTS idx_pav_attribute_value ON product_attribute_values(attribute_value_id);

-- =====================================================
-- 6) ALTER PRODUCTS - add common facet columns
-- =====================================================
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_original DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS sku VARCHAR(50),
ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
ADD COLUMN IF NOT EXISTS color VARCHAR(50),
ADD COLUMN IF NOT EXISTS size_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS material VARCHAR(100),
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stock_status VARCHAR(20) DEFAULT 'in_stock',
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_is_new ON products(is_new);
CREATE INDEX IF NOT EXISTS idx_products_published ON products(published_at DESC);

-- =====================================================
-- 7) RLS + Policies
-- =====================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Public read
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Public read active categories'
    ) THEN
        CREATE POLICY "Public read active categories" ON categories FOR SELECT USING (is_active = true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'product_categories' AND policyname = 'Public read product_categories'
    ) THEN
        CREATE POLICY "Public read product_categories" ON product_categories FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attributes' AND policyname = 'Public read active attributes'
    ) THEN
        CREATE POLICY "Public read active attributes" ON attributes FOR SELECT USING (is_active = true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attribute_values' AND policyname = 'Public read active attribute_values'
    ) THEN
        CREATE POLICY "Public read active attribute_values" ON attribute_values FOR SELECT USING (is_active = true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'product_attribute_values' AND policyname = 'Public read product_attribute_values'
    ) THEN
        CREATE POLICY "Public read product_attribute_values" ON product_attribute_values FOR SELECT USING (true);
    END IF;

    -- Admin full CRUD
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Admin all categories'
    ) THEN
        CREATE POLICY "Admin all categories" ON categories FOR ALL USING (is_admin()) WITH CHECK (is_admin());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'product_categories' AND policyname = 'Admin all product_categories'
    ) THEN
        CREATE POLICY "Admin all product_categories" ON product_categories FOR ALL USING (is_admin()) WITH CHECK (is_admin());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attributes' AND policyname = 'Admin all attributes'
    ) THEN
        CREATE POLICY "Admin all attributes" ON attributes FOR ALL USING (is_admin()) WITH CHECK (is_admin());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attribute_values' AND policyname = 'Admin all attribute_values'
    ) THEN
        CREATE POLICY "Admin all attribute_values" ON attribute_values FOR ALL USING (is_admin()) WITH CHECK (is_admin());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'product_attribute_values' AND policyname = 'Admin all product_attribute_values'
    ) THEN
        CREATE POLICY "Admin all product_attribute_values" ON product_attribute_values FOR ALL USING (is_admin()) WITH CHECK (is_admin());
    END IF;
END $$;

-- =====================================================
-- 8) VIEW: products_search_view
-- =====================================================
CREATE OR REPLACE VIEW products_search_view AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.category as legacy_category,
    p.badge,
    p.image_url,
    p.icon,
    p.gradient,
    p.is_featured,
    p.sort_order,
    p.created_at,
    p.price,
    p.price_original,
    p.brand,
    p.color,
    p.size_type,
    p.material,
    p.gender,
    p.is_new,
    p.is_on_sale,
    p.stock_status,
    p.published_at,
    ARRAY_AGG(DISTINCT c.id) FILTER (WHERE c.id IS NOT NULL) as category_ids,
    ARRAY_AGG(DISTINCT c.slug) FILTER (WHERE c.slug IS NOT NULL) as category_slugs,
    ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as category_names,
    JSONB_OBJECT_AGG(
        COALESCE(a.slug, 'unknown'),
        JSONB_BUILD_OBJECT('value', av.value, 'slug', av.slug, 'color_code', av.color_code)
    ) FILTER (WHERE a.slug IS NOT NULL) as attributes
FROM products p
LEFT JOIN product_categories pc ON p.id = pc.product_id
LEFT JOIN categories c ON pc.category_id = c.id AND c.is_active = true
LEFT JOIN product_attribute_values pav ON p.id = pav.product_id
LEFT JOIN attribute_values av ON pav.attribute_value_id = av.id AND av.is_active = true
LEFT JOIN attributes a ON av.attribute_id = a.id AND a.is_active = true
GROUP BY p.id;

-- =====================================================
-- 9) RPC: get_products_faceted(...)
-- =====================================================
CREATE OR REPLACE FUNCTION get_products_faceted(
    p_category_ids INT[] DEFAULT NULL,
    p_gender VARCHAR DEFAULT NULL,
    p_brands VARCHAR[] DEFAULT NULL,
    p_colors VARCHAR[] DEFAULT NULL,
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
    v_offset INT;
    v_products JSONB;
    v_total_count INT;
    v_facets JSONB;
BEGIN
    v_offset := (p_page - 1) * p_per_page;

    WITH filtered_products AS (
        SELECT DISTINCT p.*
        FROM products p
        LEFT JOIN product_categories pc ON p.id = pc.product_id
        WHERE 1=1
            AND (p_category_ids IS NULL OR pc.category_id = ANY(p_category_ids))
            AND (p_gender IS NULL OR p.gender = p_gender OR p.category = p_gender)
            AND (p_brands IS NULL OR p.brand = ANY(p_brands))
            AND (p_colors IS NULL OR p.color = ANY(p_colors))
            AND (p_price_min IS NULL OR p.price >= p_price_min)
            AND (p_price_max IS NULL OR p.price <= p_price_max)
            AND (p_is_new IS NULL OR p.is_new = p_is_new)
            AND (p_is_on_sale IS NULL OR p.is_on_sale = p_is_on_sale)
            AND (p_search_term IS NULL OR 
                 p.name ILIKE '%' || p_search_term || '%' OR 
                 p.description ILIKE '%' || p_search_term || '%' OR
                 p.brand ILIKE '%' || p_search_term || '%')
    ),
    sorted_products AS (
        SELECT *
        FROM filtered_products
        ORDER BY
            CASE WHEN p_sort_by = 'newest' THEN COALESCE(published_at, created_at) END DESC NULLS LAST,
            CASE WHEN p_sort_by = 'price_asc' THEN COALESCE(price, 999999) END ASC,
            CASE WHEN p_sort_by = 'price_desc' THEN COALESCE(price, 0) END DESC,
            CASE WHEN p_sort_by = 'name' THEN name END ASC,
            CASE WHEN p_sort_by = 'featured' THEN is_featured END DESC,
            sort_order ASC,
            id ASC
    ),
    paginated AS (
        SELECT * FROM sorted_products
        LIMIT p_per_page OFFSET v_offset
    )
    SELECT 
        COALESCE(JSONB_AGG(ROW_TO_JSON(paginated)::jsonb), '[]'::jsonb),
        (SELECT COUNT(*) FROM filtered_products)
    INTO v_products, v_total_count
    FROM paginated;

    WITH base_products AS (
        SELECT DISTINCT p.*
        FROM products p
        WHERE 1=1
            AND (p_search_term IS NULL OR 
                 p.name ILIKE '%' || p_search_term || '%' OR 
                 p.description ILIKE '%' || p_search_term || '%')
    )
    SELECT JSONB_BUILD_OBJECT(
        'categories', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
                'id', c.id,
                'name', c.name,
                'slug', c.slug,
                'parent_id', c.parent_id,
                'count', COALESCE(cat_counts.cnt, 0)
            ) ORDER BY c.sort_order, c.name), '[]'::jsonb)
            FROM categories c
            LEFT JOIN (
                SELECT pc.category_id, COUNT(DISTINCT p.id) as cnt
                FROM base_products p
                JOIN product_categories pc ON p.id = pc.product_id
                GROUP BY pc.category_id
            ) cat_counts ON c.id = cat_counts.category_id
            WHERE c.is_active = true
        ),
        'genders', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
                'value', gender_val,
                'count', cnt
            )), '[]'::jsonb)
            FROM (
                SELECT COALESCE(gender, category) as gender_val, COUNT(*) as cnt
                FROM base_products
                WHERE COALESCE(gender, category) IS NOT NULL
                GROUP BY COALESCE(gender, category)
            ) g
        ),
        'brands', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
                'value', brand,
                'count', cnt
            ) ORDER BY cnt DESC), '[]'::jsonb)
            FROM (
                SELECT brand, COUNT(*) as cnt
                FROM base_products
                WHERE brand IS NOT NULL
                GROUP BY brand
            ) b
        ),
        'colors', (
            SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
                'value', color,
                'count', cnt
            ) ORDER BY cnt DESC), '[]'::jsonb)
            FROM (
                SELECT color, COUNT(*) as cnt
                FROM base_products
                WHERE color IS NOT NULL
                GROUP BY color
            ) col
        ),
        'price_range', (
            SELECT JSONB_BUILD_OBJECT(
                'min', COALESCE(MIN(price), 0),
                'max', COALESCE(MAX(price), 1000)
            )
            FROM base_products
            WHERE price IS NOT NULL
        )
    ) INTO v_facets;

    RETURN JSONB_BUILD_OBJECT(
        'items', v_products,
        'total_count', v_total_count,
        'total_pages', CEIL(v_total_count::decimal / p_per_page),
        'current_page', p_page,
        'per_page', p_per_page,
        'facets', v_facets
    );
END;
$$;

-- =====================================================
-- 10) RPC: get_categories_tree()
-- =====================================================
CREATE OR REPLACE FUNCTION get_categories_tree()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (
        WITH RECURSIVE category_tree AS (
            SELECT 
                c.id,
                c.name,
                c.slug,
                c.description,
                c.icon,
                c.image_url,
                c.sort_order,
                c.product_count,
                0 as level,
                ARRAY[c.id] as path
            FROM categories c
            WHERE c.parent_id IS NULL AND c.is_active = true
            
            UNION ALL
            
            SELECT 
                c.id,
                c.name,
                c.slug,
                c.description,
                c.icon,
                c.image_url,
                c.sort_order,
                c.product_count,
                ct.level + 1,
                ct.path || c.id
            FROM categories c
            JOIN category_tree ct ON c.parent_id = ct.id
            WHERE c.is_active = true
        )
        SELECT COALESCE(JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'id', id,
                'name', name,
                'slug', slug,
                'description', description,
                'icon', icon,
                'image_url', image_url,
                'product_count', product_count,
                'level', level,
                'path', path
            ) ORDER BY path, sort_order
        ), '[]'::jsonb)
        FROM category_tree
    );
END;
$$;

-- =====================================================
-- 11) Trigger: keep categories.product_count updated
-- =====================================================
CREATE OR REPLACE FUNCTION update_category_product_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE categories c
    SET product_count = (
        SELECT COUNT(DISTINCT pc.product_id)
        FROM product_categories pc
        WHERE pc.category_id = c.id
    )
    WHERE c.id IN (
        SELECT category_id FROM product_categories 
        WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_category_count ON product_categories;
CREATE TRIGGER trigger_update_category_count
AFTER INSERT OR UPDATE OR DELETE ON product_categories
FOR EACH ROW EXECUTE FUNCTION update_category_product_count();

-- =====================================================
-- 12) Seed: categories
-- =====================================================
INSERT INTO categories (name, slug, icon, sort_order, parent_id) VALUES
('Vêtements', 'vetements', 'fa-tshirt', 1, NULL),
('Accessoires', 'accessoires', 'fa-glasses', 2, NULL),
('Professionnel', 'professionnel', 'fa-briefcase', 3, NULL)
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE
    vetements_id INT;
    accessoires_id INT;
    professionnel_id INT;
BEGIN
    SELECT id INTO vetements_id FROM categories WHERE slug = 'vetements';
    SELECT id INTO accessoires_id FROM categories WHERE slug = 'accessoires';
    SELECT id INTO professionnel_id FROM categories WHERE slug = 'professionnel';

    INSERT INTO categories (name, slug, icon, sort_order, parent_id) VALUES
    ('T-shirts', 't-shirts', 'fa-tshirt', 1, vetements_id),
    ('Chemises', 'chemises', 'fa-shirt', 2, vetements_id),
    ('Pantalons', 'pantalons', 'fa-socks', 3, vetements_id),
    ('Jeans', 'jeans', 'fa-jeans', 4, vetements_id),
    ('Vestes', 'vestes', 'fa-vest', 5, vetements_id),
    ('Pulls', 'pulls', 'fa-mitten', 6, vetements_id)
    ON CONFLICT (slug) DO NOTHING;

    INSERT INTO categories (name, slug, icon, sort_order, parent_id) VALUES
    ('Ceintures', 'ceintures', 'fa-ring', 1, accessoires_id),
    ('Écharpes', 'echarpes', 'fa-scarf', 2, accessoires_id),
    ('Chapeaux', 'chapeaux', 'fa-hat-cowboy', 3, accessoires_id)
    ON CONFLICT (slug) DO NOTHING;

    INSERT INTO categories (name, slug, icon, sort_order, parent_id) VALUES
    ('Uniformes', 'uniformes', 'fa-user-tie', 1, professionnel_id),
    ('Vêtements de travail', 'vetements-travail', 'fa-hard-hat', 2, professionnel_id)
    ON CONFLICT (slug) DO NOTHING;
END $$;

-- =====================================================
-- 13) Seed: attributes + values
-- =====================================================
INSERT INTO attributes (name, slug, display_type, sort_order) VALUES
('Couleur', 'couleur', 'color', 1),
('Taille', 'taille', 'size', 2),
('Matière', 'matiere', 'checkbox', 3),
('Coupe', 'coupe', 'checkbox', 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO attribute_values (attribute_id, value, slug, color_code, sort_order)
SELECT a.id, v.value, v.slug, v.color_code, v.sort_order
FROM attributes a,
(VALUES
    ('Noir', 'noir', '#000000', 1),
    ('Blanc', 'blanc', '#FFFFFF', 2),
    ('Bleu', 'bleu', '#1e3a8a', 3),
    ('Bleu clair', 'bleu-clair', '#60a5fa', 4),
    ('Gris', 'gris', '#6b7280', 5),
    ('Beige', 'beige', '#d4a574', 6),
    ('Rouge', 'rouge', '#dc2626', 7),
    ('Vert', 'vert', '#16a34a', 8)
) AS v(value, slug, color_code, sort_order)
WHERE a.slug = 'couleur'
ON CONFLICT (attribute_id, slug) DO NOTHING;

INSERT INTO attribute_values (attribute_id, value, slug, sort_order)
SELECT a.id, v.value, v.slug, v.sort_order
FROM attributes a,
(VALUES
    ('XS', 'xs', 1),
    ('S', 's', 2),
    ('M', 'm', 3),
    ('L', 'l', 4),
    ('XL', 'xl', 5),
    ('XXL', 'xxl', 6)
) AS v(value, slug, sort_order)
WHERE a.slug = 'taille'
ON CONFLICT (attribute_id, slug) DO NOTHING;

INSERT INTO attribute_values (attribute_id, value, slug, sort_order)
SELECT a.id, v.value, v.slug, v.sort_order
FROM attributes a,
(VALUES
    ('Coton', 'coton', 1),
    ('Polyester', 'polyester', 2),
    ('Lin', 'lin', 3),
    ('Laine', 'laine', 4),
    ('Denim', 'denim', 5),
    ('Viscose', 'viscose', 6)
) AS v(value, slug, sort_order)
WHERE a.slug = 'matiere'
ON CONFLICT (attribute_id, slug) DO NOTHING;

INSERT INTO attribute_values (attribute_id, value, slug, sort_order)
SELECT a.id, v.value, v.slug, v.sort_order
FROM attributes a,
(VALUES
    ('Regular', 'regular', 1),
    ('Slim', 'slim', 2),
    ('Relaxed', 'relaxed', 3),
    ('Oversized', 'oversized', 4)
) AS v(value, slug, sort_order)
WHERE a.slug = 'coupe'
ON CONFLICT (attribute_id, slug) DO NOTHING;

-- =====================================================
-- 14) Migration helper: map legacy products.category to new categories
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
ON CONFLICT (product_id, category_id) DO NOTHING;

UPDATE products
SET gender = category
WHERE category IN ('homme', 'femme') AND gender IS NULL;

COMMIT;

-- End of file
