-- ============================================================
-- CONTENT RESTRICTION SYSTEM - Database Schema
-- Execute this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. USER ROLES & ACCESS LEVELS
-- ============================================================

-- Create enum for user roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('visitor', 'member', 'premium', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for subscription tiers
DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 2. USER PROFILES TABLE (extends Supabase auth.users)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'visitor',
    subscription_tier subscription_tier DEFAULT 'free',
    access_level INTEGER DEFAULT 0, -- 0=visitor, 1=member, 2=premium, 3=admin
    subscription_start TIMESTAMPTZ,
    subscription_end TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_access_level ON user_profiles(access_level);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription ON user_profiles(subscription_tier);

-- ============================================================
-- 3. ADD RESTRICTION FIELDS TO EXISTING TABLES
-- ============================================================

-- Add restriction fields to products table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
        -- Add restriction fields
        ALTER TABLE products ADD COLUMN IF NOT EXISTS min_access_level INTEGER DEFAULT 0;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN DEFAULT false;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS restricted_preview TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS unlock_message TEXT DEFAULT 'Passez à Premium pour accéder à ce contenu';
        
        -- Add category system fields
        ALTER TABLE products ADD COLUMN IF NOT EXISTS gender TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS color TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS material TEXT;
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_products_access ON products(min_access_level, is_restricted);
        CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender);
        CREATE INDEX IF NOT EXISTS idx_products_color ON products(color);
        CREATE INDEX IF NOT EXISTS idx_products_material ON products(material);
    END IF;
END $$;

-- Add restriction fields to news table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'news') THEN
        ALTER TABLE news ADD COLUMN IF NOT EXISTS min_access_level INTEGER DEFAULT 0;
        ALTER TABLE news ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN DEFAULT false;
        ALTER TABLE news ADD COLUMN IF NOT EXISTS restricted_preview TEXT;
        ALTER TABLE news ADD COLUMN IF NOT EXISTS unlock_message TEXT DEFAULT 'Passez à Premium pour accéder à ce contenu';
        CREATE INDEX IF NOT EXISTS idx_news_access ON news(min_access_level, is_restricted);
    END IF;
END $$;

-- Add restriction fields to showroom table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'showroom') THEN
        ALTER TABLE showroom ADD COLUMN IF NOT EXISTS min_access_level INTEGER DEFAULT 0;
        ALTER TABLE showroom ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN DEFAULT false;
        CREATE INDEX IF NOT EXISTS idx_showroom_access ON showroom(min_access_level, is_restricted);
    END IF;
END $$;

-- ============================================================
-- 4. RESTRICTED CONTENT TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS restricted_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type TEXT NOT NULL, -- 'product', 'article', 'news', 'showroom'
    content_id UUID NOT NULL,
    min_access_level INTEGER DEFAULT 1,
    min_role user_role DEFAULT 'member',
    preview_text TEXT, -- What to show restricted users
    preview_image_url TEXT, -- Blurred/pixelated preview
    unlock_price DECIMAL(10,2), -- For individual purchases
    unlock_message TEXT DEFAULT 'Contenu réservé aux membres Premium',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(content_type, content_id)
);

CREATE INDEX IF NOT EXISTS idx_restricted_content_type ON restricted_content(content_type, content_id);

-- ============================================================
-- 5. USER ACCESS GRANTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS user_access_grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    content_id UUID NOT NULL,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- NULL = permanent access
    access_reason TEXT, -- 'subscription', 'purchase', 'gift', 'admin_grant'
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(user_id, content_type, content_id)
);

CREATE INDEX IF NOT EXISTS idx_user_access_user ON user_access_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_access_content ON user_access_grants(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_user_access_expires ON user_access_grants(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================
-- 6. SUBSCRIPTION PLANS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    tier subscription_tier NOT NULL,
    access_level INTEGER NOT NULL,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (name, slug, tier, access_level, price_monthly, price_yearly, features, sort_order) VALUES
('Gratuit', 'free', 'free', 0, 0, 0, '["Accès aux articles publics", "Aperçu des collections"]', 0),
('Membre', 'member', 'basic', 1, 9.99, 99.99, '["Accès complet aux articles", "Collections exclusives", "Newsletter premium"]', 1),
('Premium', 'premium', 'premium', 2, 19.99, 199.99, '["Tout Membre inclus", "Accès anticipé nouveautés", "Remises exclusives", "Support prioritaire"]', 2),
('Entreprise', 'enterprise', 'enterprise', 3, 49.99, 499.99, '["Tout Premium inclus", "API accès", "Catalogue complet", "Account manager dédié"]', 3)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 7. RPC FUNCTIONS FOR ACCESS CHECKING
-- ============================================================

-- Function to check if user has access to content
CREATE OR REPLACE FUNCTION check_user_access(
    p_user_id UUID,
    p_content_type TEXT,
    p_content_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_access_level INTEGER;
    v_content_min_level INTEGER;
    v_has_grant BOOLEAN;
BEGIN
    -- Get user's access level
    SELECT COALESCE(access_level, 0) INTO v_user_access_level
    FROM user_profiles
    WHERE id = p_user_id;
    
    -- If no user found, treat as visitor (level 0)
    IF v_user_access_level IS NULL THEN
        v_user_access_level := 0;
    END IF;
    
    -- Get content's minimum access level
    IF p_content_type = 'product' THEN
        SELECT COALESCE(min_access_level, 0) INTO v_content_min_level
        FROM products WHERE id = p_content_id;
    ELSIF p_content_type = 'news' THEN
        SELECT COALESCE(min_access_level, 0) INTO v_content_min_level
        FROM news WHERE id = p_content_id;
    ELSIF p_content_type = 'showroom' THEN
        SELECT COALESCE(min_access_level, 0) INTO v_content_min_level
        FROM showroom WHERE id = p_content_id;
    ELSE
        SELECT COALESCE(min_access_level, 0) INTO v_content_min_level
        FROM restricted_content 
        WHERE content_type = p_content_type AND content_id = p_content_id;
    END IF;
    
    -- If no restriction found, allow access
    IF v_content_min_level IS NULL OR v_content_min_level = 0 THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user's level is sufficient
    IF v_user_access_level >= v_content_min_level THEN
        RETURN TRUE;
    END IF;
    
    -- Check for individual access grant
    SELECT EXISTS(
        SELECT 1 FROM user_access_grants
        WHERE user_id = p_user_id
        AND content_type = p_content_type
        AND content_id = p_content_id
        AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
    ) INTO v_has_grant;
    
    RETURN v_has_grant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's access level
CREATE OR REPLACE FUNCTION get_user_access_level(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_level INTEGER;
BEGIN
    SELECT COALESCE(access_level, 0) INTO v_level
    FROM user_profiles
    WHERE id = p_user_id;
    
    RETURN COALESCE(v_level, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant access to content
CREATE OR REPLACE FUNCTION grant_user_access(
    p_user_id UUID,
    p_content_type TEXT,
    p_content_id UUID,
    p_granted_by UUID,
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_reason TEXT DEFAULT 'admin_grant'
) RETURNS UUID AS $$
DECLARE
    v_grant_id UUID;
BEGIN
    INSERT INTO user_access_grants (user_id, content_type, content_id, granted_by, expires_at, access_reason)
    VALUES (p_user_id, p_content_type, p_content_id, p_granted_by, p_expires_at, p_reason)
    ON CONFLICT (user_id, content_type, content_id) 
    DO UPDATE SET 
        expires_at = EXCLUDED.expires_at,
        access_reason = EXCLUDED.access_reason,
        is_active = TRUE,
        granted_at = NOW()
    RETURNING id INTO v_grant_id;
    
    RETURN v_grant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upgrade user subscription
CREATE OR REPLACE FUNCTION upgrade_user_subscription(
    p_user_id UUID,
    p_tier subscription_tier,
    p_duration_months INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    v_access_level INTEGER;
BEGIN
    -- Get access level for tier
    SELECT access_level INTO v_access_level
    FROM subscription_plans
    WHERE tier = p_tier AND is_active = TRUE
    LIMIT 1;
    
    IF v_access_level IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update user profile
    UPDATE user_profiles
    SET 
        subscription_tier = p_tier,
        access_level = v_access_level,
        role = CASE 
            WHEN v_access_level >= 3 THEN 'admin'::user_role
            WHEN v_access_level >= 2 THEN 'premium'::user_role
            WHEN v_access_level >= 1 THEN 'member'::user_role
            ELSE 'visitor'::user_role
        END,
        subscription_start = NOW(),
        subscription_end = NOW() + (p_duration_months || ' months')::INTERVAL,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restricted_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- User profiles policies
-- INSERT policy: Allow trigger/functions to create profiles (no user context check)
CREATE POLICY "Allow profile creation" ON user_profiles
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Note: Admins use service role key to view all profiles (bypasses RLS)

-- User access grants policies
CREATE POLICY "Users can view own grants" ON user_access_grants
    FOR SELECT USING (user_id = auth.uid());

-- Note: Use service role key for admin operations on grants
-- Service role bypasses RLS automatically

-- Subscription plans - public read
CREATE POLICY "Anyone can view active plans" ON subscription_plans
    FOR SELECT USING (is_active = TRUE);

-- ============================================================
-- 9. TRIGGERS
-- ============================================================

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_username TEXT;
    v_base_username TEXT;
    v_counter INTEGER := 1;
BEGIN
    -- Get base username from email or metadata
    v_base_username := COALESCE(
        NEW.raw_user_meta_data->>'username', 
        split_part(NEW.email, '@', 1)
    );
    
    v_username := v_base_username;
    
    -- Handle username conflicts by adding a number suffix
    WHILE EXISTS (SELECT 1 FROM user_profiles WHERE username = v_username) LOOP
        v_username := v_base_username || v_counter;
        v_counter := v_counter + 1;
    END LOOP;
    
    -- Insert user profile (simple conflict handling on id only)
    INSERT INTO user_profiles (id, email, username, role, access_level)
    VALUES (
        NEW.id,
        NEW.email,
        v_username,
        'visitor',
        0
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Handle any remaining unique constraint violations
        RAISE WARNING 'Unique constraint violation creating user profile for %: %', NEW.email, SQLERRM;
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log other errors but don't prevent user creation
        RAISE WARNING 'Error creating user profile for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_profiles_updated ON user_profiles;
CREATE TRIGGER user_profiles_updated
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 10. SAMPLE RESTRICTED CONTENT
-- ============================================================

-- Mark some products as restricted (example)
-- UPDATE products SET min_access_level = 1, is_restricted = true WHERE category = 'premium';
-- UPDATE products SET min_access_level = 2, is_restricted = true WHERE category = 'exclusive';

-- Mark some news as restricted
-- UPDATE news SET min_access_level = 1, is_restricted = true WHERE is_featured = true;

COMMENT ON TABLE user_profiles IS 'Extended user profiles with access control';
COMMENT ON TABLE user_access_grants IS 'Individual content access grants for users';
COMMENT ON TABLE restricted_content IS 'Content restriction definitions';
COMMENT ON TABLE subscription_plans IS 'Available subscription tiers';
COMMENT ON FUNCTION check_user_access IS 'Check if user can access specific content';
COMMENT ON FUNCTION get_user_access_level IS 'Get user access level (0-3)';
COMMENT ON FUNCTION grant_user_access IS 'Grant user access to specific content';
COMMENT ON FUNCTION upgrade_user_subscription IS 'Upgrade user to new subscription tier';

-- ============================================================
-- DONE! Content Restriction System Ready
-- ============================================================

