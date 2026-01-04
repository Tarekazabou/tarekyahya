-- =====================================================
-- PRIMAVET DATABASE SCHEMA
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Site Configuration
CREATE TABLE IF NOT EXISTS site_config (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(100) DEFAULT 'Primavet',
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    business_hours VARCHAR(100),
    social_links JSONB DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    badge VARCHAR(50),
    image_url TEXT,
    icon VARCHAR(50) DEFAULT 'fa-tshirt',
    gradient VARCHAR(100) DEFAULT 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    is_featured BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- News Articles
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    content TEXT,
    excerpt TEXT,
    category VARCHAR(50),
    author VARCHAR(100) DEFAULT 'Admin',
    image_url TEXT,
    icon VARCHAR(50) DEFAULT 'fa-newspaper',
    gradient VARCHAR(100) DEFAULT 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    published_at DATE DEFAULT CURRENT_DATE,
    is_featured BOOLEAN DEFAULT false
);

-- Job Listings
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    location VARCHAR(100),
    contract_type VARCHAR(50),
    experience VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Showroom Items
CREATE TABLE IF NOT EXISTS showroom_items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    icon VARCHAR(50) DEFAULT 'fa-image',
    gradient VARCHAR(100) DEFAULT 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    sort_order INT DEFAULT 0
);

-- Statistics
CREATE TABLE IF NOT EXISTS stats (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    value VARCHAR(100) NOT NULL,
    label VARCHAR(100),
    icon VARCHAR(50),
    trend VARCHAR(20),
    trend_direction VARCHAR(10),
    section VARCHAR(50),
    sort_order INT DEFAULT 0
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(50),
    order_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    is_vip BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Messages (Form Submissions)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT NOW(),
    form_type TEXT NOT NULL, -- 'contact', 'quote', 'application', 'suggestion'
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    subject TEXT,
    message TEXT,
    job_id TEXT, -- for job applications
    product_interest TEXT, -- for quote form
    quantity TEXT, -- for quote form
    status TEXT DEFAULT 'unread', -- 'unread', 'read', 'replied', 'archived'
    metadata JSONB -- for additional form-specific data
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE showroom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read site_config" ON site_config FOR SELECT USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read news" ON news FOR SELECT USING (true);
CREATE POLICY "Public read all jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Public read showroom" ON showroom_items FOR SELECT USING (true);
CREATE POLICY "Public read stats" ON stats FOR SELECT USING (true);
CREATE POLICY "Public read clients" ON clients FOR SELECT USING (true);

-- Public write access for news (admin functionality)
CREATE POLICY "Public insert news" ON news FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update news" ON news FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete news" ON news FOR DELETE USING (true);

-- Public write access for jobs (admin functionality)
CREATE POLICY "Public insert jobs" ON jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update jobs" ON jobs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete jobs" ON jobs FOR DELETE USING (true);

-- Messages policies (public insert for form submissions, authenticated users can read/update/delete)
-- NOTE: In production, consider restricting SELECT/UPDATE/DELETE to auth.uid() IS NOT NULL
CREATE POLICY "Public insert messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Public update messages" ON messages FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete messages" ON messages FOR DELETE USING (true);

-- Products CRUD policies (admin functionality)
-- NOTE: In production, restrict write operations to authenticated admin users: auth.uid() IS NOT NULL
CREATE POLICY "Public insert products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update products" ON products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete products" ON products FOR DELETE USING (true);

-- Showroom CRUD policies (admin functionality)
-- NOTE: In production, restrict write operations to authenticated admin users: auth.uid() IS NOT NULL
CREATE POLICY "Public insert showroom" ON showroom_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update showroom" ON showroom_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete showroom" ON showroom_items FOR DELETE USING (true);

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Site Config
INSERT INTO site_config (company_name, address, phone, email, business_hours, social_links)
VALUES (
    'Primavet',
    '123 Avenue du Textile, 75001 Paris, France',
    '+33 1 23 45 67 89',
    'contact@primavet.com',
    'Lun - Ven: 9h00 - 18h00',
    '{"facebook": "#", "instagram": "#", "linkedin": "#", "twitter": "#"}'
);

-- Products
INSERT INTO products (name, description, category, badge, icon, gradient, is_featured, sort_order) VALUES
('Chemises Classiques', 'Collection de chemises élégantes pour homme, disponibles en plusieurs couleurs et tailles.', 'homme', 'Nouveau', 'fa-tshirt', 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', true, 1),
('Costumes Business', 'Costumes professionnels de haute qualité pour une allure impeccable au bureau.', 'homme', NULL, 'fa-user-tie', 'linear-gradient(135deg, #1e293b 0%, #475569 100%)', true, 2),
('Polos Casual', 'Polos confortables pour un style décontracté mais soigné au quotidien.', 'homme', NULL, 'fa-vest', 'linear-gradient(135deg, #059669 0%, #10b981 100%)', false, 3),
('Blouses Élégantes', 'Collection de blouses féminines et raffinées pour toutes les occasions.', 'femme', 'Tendance', 'fa-tshirt', 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)', true, 4),
('Robes Collection', 'Robes élégantes pour femme, parfaites pour les événements professionnels et personnels.', 'femme', NULL, 'fa-dress', 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', false, 5),
('Tailleurs Femme', 'Tailleurs professionnels pour une image de marque impeccable.', 'femme', NULL, 'fa-vest', 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)', false, 6),
('Vêtements de Travail', 'Tenues de travail résistantes et confortables pour tous les secteurs d''activité.', 'professionnel', 'Pro', 'fa-hard-hat', 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)', true, 7),
('Blouses Médicales', 'Blouses et uniformes pour le secteur médical, confortables et faciles d''entretien.', 'professionnel', NULL, 'fa-user-md', 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', false, 8),
('Uniformes Restauration', 'Tenues professionnelles pour la restauration et l''hôtellerie.', 'professionnel', NULL, 'fa-utensils', 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', false, 9),
('Chapeaux & Casquettes', 'Accessoires de tête pour compléter votre tenue professionnelle ou décontractée.', 'accessoires', NULL, 'fa-hat-cowboy', 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)', false, 10),
('Écharpes & Foulards', 'Collection d''écharpes et foulards élégants pour toutes les saisons.', 'accessoires', NULL, 'fa-scarf', 'linear-gradient(135deg, #854d0e 0%, #a16207 100%)', false, 11),
('Chaussettes & Bas', 'Chaussettes de qualité pour le confort quotidien, disponibles en plusieurs coloris.', 'accessoires', NULL, 'fa-socks', 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)', false, 12);

-- News
INSERT INTO news (title, content, excerpt, category, author, icon, gradient, published_at, is_featured) VALUES
('Lancement de la Collection Printemps 2025', 'Nous sommes ravis de vous présenter en avant-première notre nouvelle collection Printemps 2025. Des pièces uniques alliant élégance et confort, conçues avec des matériaux de première qualité.', 'Découvrez en avant-première notre nouvelle collection printemps avec des pièces uniques et tendances.', 'Collection', 'Admin', 'fa-newspaper', 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', '2024-12-15', true),
('Primavet au Salon International du Textile 2025', 'Primavet sera présent au Salon International du Textile qui se tiendra à Paris du 15 au 18 janvier 2025. Venez nous rencontrer sur notre stand.', 'Primavet sera présent au salon international du textile. Venez nous rencontrer sur notre stand.', 'Événement', 'Admin', 'fa-calendar-check', 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)', '2024-12-10', true),
('Notre Engagement Éco-Responsable', 'Dans le cadre de notre politique de développement durable, nous lançons une nouvelle gamme de produits éco-responsables.', 'Notre nouvelle gamme éco-responsable utilise des matériaux durables et recyclés.', 'Développement Durable', 'Admin', 'fa-leaf', 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', '2024-12-05', true),
('Nouveau Partenariat avec des Marques Internationales', 'Primavet est fière d''annoncer un nouveau partenariat stratégique avec plusieurs marques internationales.', 'Cette collaboration nous permettra d''étendre notre présence à l''international.', 'Partenariat', 'Admin', 'fa-handshake', 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', '2024-11-28', false),
('Innovation : Nos Nouveaux Tissus Techniques', 'Découvrez nos dernières innovations en matière de tissus techniques. Résistants, respirants et confortables.', 'Ces nouveaux matériaux révolutionneront votre façon de concevoir les vêtements professionnels.', 'Innovation', 'Admin', 'fa-lightbulb', 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)', '2024-11-20', false),
('Primavet récompensée pour son Excellence', 'Nous avons le plaisir de vous annoncer que Primavet a reçu le Prix de l''Excellence Textile 2024.', 'Cette distinction récompense notre engagement constant envers la qualité et l''innovation.', 'Récompense', 'Admin', 'fa-award', 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)', '2024-11-15', false);

-- Jobs
INSERT INTO jobs (title, location, contract_type, experience, description, is_active) VALUES
('Responsable Commercial', 'Paris', 'CDI', '5+ ans d''expérience', 'Nous recherchons un(e) Responsable Commercial(e) pour développer notre portefeuille clients et gérer les relations avec nos partenaires.', true),
('Designer Textile', 'Paris', 'CDI', '3+ ans d''expérience', 'Rejoignez notre équipe créative pour concevoir des collections innovantes et tendances.', true),
('Technicien(ne) de Production', 'Lyon', 'CDI', '2+ ans d''expérience', 'Assurez le bon fonctionnement de nos équipements de production et le contrôle qualité.', true),
('Assistant(e) Marketing Digital', 'Paris', 'CDD', '1+ an d''expérience', 'Participez au développement de notre présence digitale et à nos campagnes marketing.', true),
('Stage - Développement Produit', 'Paris', 'Stage (6 mois)', 'Étudiant Bac+4/5', 'Intégrez notre équipe R&D et participez au développement de nouveaux produits textiles.', true);

-- Showroom Items
INSERT INTO showroom_items (title, description, category, icon, gradient, sort_order) VALUES
('Collection Printemps 2024', 'Nouvelle collection de vêtements légers et colorés', 'collection', 'fa-tshirt', 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', 1),
('Collection Été 2024', 'Vêtements frais et confortables pour l''été', 'collection', 'fa-vest', 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)', 2),
('Collection Automne 2024', 'Tons chauds et matières douces', 'collection', 'fa-user-tie', 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)', 3),
('Collection Hiver 2024', 'Vêtements chauds et élégants', 'collection', 'fa-mitten', 'linear-gradient(135deg, #1e293b 0%, #475569 100%)', 4),
('Uniforme Entreprise ABC', 'Réalisation complète d''uniformes corporate', 'realisation', 'fa-industry', 'linear-gradient(135deg, #059669 0%, #10b981 100%)', 5),
('Tenues Hôtel Luxe', 'Collection complète pour chaîne hôtelière', 'realisation', 'fa-hotel', 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', 6),
('Uniformes Restaurant Étoilé', 'Tenues personnalisées pour la haute gastronomie', 'realisation', 'fa-utensils', 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)', 7),
('Boutique Mode Paris', 'Collection exclusive pour boutique parisienne', 'realisation', 'fa-store', 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)', 8),
('Salon du Textile 2024', 'Notre présence au salon international', 'evenement', 'fa-calendar-check', 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)', 9),
('Prix de l''Innovation 2024', 'Reconnaissance pour nos créations innovantes', 'evenement', 'fa-award', 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', 10),
('Partenariat International', 'Nouvelle collaboration avec des marques mondiales', 'evenement', 'fa-handshake', 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)', 11),
('Journée Portes Ouvertes', 'Visite de nos ateliers de production', 'evenement', 'fa-users', 'linear-gradient(135deg, #854d0e 0%, #a16207 100%)', 12);

-- Statistics
INSERT INTO stats (key, value, label, icon, trend, trend_direction, section, sort_order) VALUES
-- General Activity
('total_visitors', '24589', 'Visiteurs Totaux', 'fa-eye', '+12%', 'up', 'activity', 1),
('total_clients', '1247', 'Clients Totaux', 'fa-users', '+8%', 'up', 'activity', 2),
('total_orders', '3842', 'Commandes Totales', 'fa-shopping-cart', '+15%', 'up', 'activity', 3),
('conversion_rate', '5.07%', 'Taux de Conversion', 'fa-percentage', '+2.3%', 'up', 'activity', 4),
-- Commercial Performance
('total_revenue', '847320', 'Chiffre d''Affaires Total', 'fa-euro-sign', '+18%', 'up', 'commercial', 1),
('monthly_revenue', '72450', 'CA du Mois', 'fa-calendar-day', '+22%', 'up', 'commercial', 2),
('sales_growth', '+18.7%', 'Croissance des Ventes', 'fa-chart-line', '+5.2%', 'up', 'commercial', 3),
('average_basket', '220', 'Panier Moyen', 'fa-receipt', NULL, NULL, 'commercial', 4),
-- Products
('total_products', '156', 'Total Produits', 'fa-box', NULL, NULL, 'products', 1),
('bestsellers', '42', 'Best-sellers', 'fa-fire', NULL, NULL, 'products', 2),
('low_rotation', '8', 'Faible Rotation', 'fa-exclamation-triangle', NULL, NULL, 'products', 3),
-- Clients
('active_clients', '892', 'Clients Actifs', 'fa-user-check', '71%', NULL, 'clients', 1),
('new_clients', '127', 'Nouveaux Clients (30j)', 'fa-user-plus', '10%', NULL, 'clients', 2),
('loyal_clients', '412', 'Clients Fidèles', 'fa-crown', '33%', NULL, 'clients', 3),
('inactive_clients', '228', 'Clients Inactifs', 'fa-user-clock', '18%', NULL, 'clients', 4),
-- Satisfaction
('avg_rating', '4.7', 'Note Moyenne', 'fa-star', NULL, NULL, 'satisfaction', 1),
('total_reviews', '1247', 'Total Avis', 'fa-comments', NULL, NULL, 'satisfaction', 2),
-- About page stats
('years_experience', '10+', 'Années d''expérience', 'fa-calendar-alt', NULL, NULL, 'about', 1),
('happy_clients', '500+', 'Clients satisfaits', 'fa-smile', NULL, NULL, 'about', 2),
('products_delivered', '1000+', 'Produits livrés', 'fa-box-open', NULL, NULL, 'about', 3),
('countries_served', '20+', 'Pays desservis', 'fa-globe', NULL, NULL, 'about', 4);

-- Clients
INSERT INTO clients (name, email, phone, order_count, status, is_vip) VALUES
('Jean Dupont', 'jean.dupont@email.com', '+33 6 12 34 56 78', 15, 'active', true),
('Marie Laurent', 'marie.laurent@email.com', '+33 6 23 45 67 89', 12, 'active', true),
('Pierre Bernard', 'pierre.bernard@email.com', '+33 6 34 56 78 90', 9, 'active', false),
('Sophie Martin', 'sophie.martin@email.com', '+33 6 45 67 89 01', 7, 'active', false),
('Lucas Petit', 'lucas.petit@email.com', '+33 6 56 78 90 12', 5, 'active', false),
('Emma Dubois', 'emma.dubois@email.com', '+33 6 67 89 01 23', 3, 'active', false),
('Thomas Moreau', 'thomas.moreau@email.com', '+33 6 78 90 12 34', 2, 'inactive', false),
('Léa Lefebvre', 'lea.lefebvre@email.com', '+33 6 89 01 23 45', 1, 'inactive', false);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- If you see this, all tables and data were created successfully!
-- Your Primavet database is ready to use.
