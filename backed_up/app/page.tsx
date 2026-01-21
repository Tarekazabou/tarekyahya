import Link from 'next/link';
import HeroSlider from './components/HeroSlider';
import ProductCard from './components/ProductCard';
import NewsCard from './components/NewsCard';
import CTABanner from './components/CTABanner';
import { getFeaturedProducts, getFeaturedNews, Product, NewsArticle } from './lib/data-service';

// Mock data for initial render (will be replaced by Supabase data)
const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Collection Classique',
    description: 'Vêtements élégants pour toutes occasions',
    category: 'homme',
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    icon: 'fa-tshirt',
    badge: 'Nouveau',
    is_featured: true,
    sort_order: 1,
  },
  {
    id: 2,
    name: 'Ligne Moderne',
    description: 'Designs contemporains et tendances',
    category: 'femme',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    icon: 'fa-vest',
    is_featured: true,
    sort_order: 2,
  },
  {
    id: 3,
    name: 'Collection Pro',
    description: 'Uniformes et tenues professionnelles',
    category: 'homme',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    icon: 'fa-user-tie',
    badge: 'Populaire',
    is_featured: true,
    sort_order: 3,
  },
];

const mockNews: NewsArticle[] = [
  {
    id: 1,
    title: 'Lancement de la Collection Printemps 2025',
    content: 'Découvrez notre nouvelle collection printanière avec des couleurs fraîches et des designs innovants.',
    excerpt: 'Découvrez notre nouvelle collection printanière avec des couleurs fraîches et des designs innovants.',
    category: 'Collection',
    author: 'Primavet',
    published_at: '2025-01-15',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    icon: 'fa-newspaper',
    is_featured: true,
  },
  {
    id: 2,
    title: 'Participation au Salon du Textile',
    content: 'Primavet sera présent au prochain salon international du textile.',
    excerpt: 'Primavet sera présent au prochain salon international du textile.',
    category: 'Événement',
    author: 'Primavet',
    published_at: '2025-01-10',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
    icon: 'fa-calendar-check',
    is_featured: true,
  },
  {
    id: 3,
    title: 'Engagement Éco-Responsable',
    content: 'Notre engagement envers des pratiques durables et respectueuses de l\'environnement.',
    excerpt: 'Notre engagement envers des pratiques durables et respectueuses de l\'environnement.',
    category: 'Développement Durable',
    author: 'Primavet',
    published_at: '2025-01-05',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    icon: 'fa-leaf',
    is_featured: true,
  },
];

async function getHomePageData() {
  try {
    const [products, news] = await Promise.all([
      getFeaturedProducts(3),
      getFeaturedNews(3),
    ]);
    return {
      products: products.length > 0 ? products : mockProducts,
      news: news.length > 0 ? news : mockNews,
    };
  } catch {
    return { products: mockProducts, news: mockNews };
  }
}

export default async function Home() {
  const { products, news } = await getHomePageData();

  return (
    <>
      {/* Hero Section */}
      <HeroSlider />

      {/* Features Section */}
      <section className="features section">
        <div className="container">
          <div className="section-title">
            <h2>Pourquoi choisir Primavet ?</h2>
            <p>Notre engagement envers la qualité et l&apos;innovation fait de nous votre partenaire prêt à porter idéal.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-award"></i>
              </div>
              <h3>Qualité Premium</h3>
              <p>Des matériaux soigneusement sélectionnés et des finitions impeccables pour des produits durables.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-lightbulb"></i>
              </div>
              <h3>Innovation Continue</h3>
              <p>Nous restons à la pointe des tendances et technologies pour vous offrir le meilleur.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-handshake"></i>
              </div>
              <h3>Service Personnalisé</h3>
              <p>Une équipe dédiée pour répondre à vos besoins spécifiques et vous accompagner dans vos projets.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-truck"></i>
              </div>
              <h3>Livraison Rapide</h3>
              <p>Respect des délais et logistique optimisée pour une livraison efficace de vos commandes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Preview Section */}
      <section className="products section section-bg">
        <div className="container">
          <div className="section-title">
            <h2>Nos Produits Phares</h2>
            <p>Découvrez notre sélection de produits prêt à porter de qualité, conçus pour répondre à tous vos besoins.</p>
          </div>

          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} featured />
            ))}
          </div>

          <div className="text-center mt-4">
            <Link href="/products" className="btn btn-primary btn-lg">
              Voir tous nos produits
            </Link>
          </div>
        </div>
      </section>

      {/* About Preview Section */}
      <section className="about section">
        <div className="container">
          <div className="about-content">
            <div className="about-image">
              <div
                style={{
                  width: '100%',
                  height: '400px',
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <i className="fas fa-industry" style={{ fontSize: '6rem', color: 'white' }}></i>
              </div>
            </div>
            <div className="about-text">
              <h2>Bienvenue chez Primavet</h2>
              <p>
                Primavet est une entreprise spécialisée dans la conception, le développement et la
                commercialisation de produits prêt à porter de haute qualité. Notre mission est de fournir des
                solutions prêt à porter innovantes et alignées avec les tendances du marché.
              </p>
              <p>
                Avec une équipe passionnée et un savoir-faire reconnu, nous accompagnons nos clients
                professionnels et grand public dans tous leurs projets prêt à porter.
              </p>

              <div className="about-features">
                <div className="about-feature">
                  <i className="fas fa-check-circle"></i>
                  <span>Qualité garantie</span>
                </div>
                <div className="about-feature">
                  <i className="fas fa-check-circle"></i>
                  <span>Expertise prêt à porter</span>
                </div>
                <div className="about-feature">
                  <i className="fas fa-check-circle"></i>
                  <span>Service client dédié</span>
                </div>
                <div className="about-feature">
                  <i className="fas fa-check-circle"></i>
                  <span>Délais respectés</span>
                </div>
              </div>

              <Link href="/about" className="btn btn-primary mt-2">
                En savoir plus sur nous
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* News Preview Section */}
      <section className="news section section-bg">
        <div className="container">
          <div className="section-title">
            <h2>Actualités & Événements</h2>
            <p>Restez informé des dernières nouvelles, collections et événements Primavet.</p>
          </div>

          <div className="news-grid">
            {news.map((article) => (
              <NewsCard key={article.id} article={article} featured />
            ))}
          </div>

          <div className="text-center mt-4">
            <Link href="/news" className="btn btn-primary btn-lg">
              Toutes les actualités
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <CTABanner
        title="Prêt à démarrer votre projet ?"
        description="Contactez-nous dès aujourd'hui pour discuter de vos besoins en prêt à porter et obtenir un devis personnalisé."
        primaryButton={{ text: 'Demander un devis', href: '/quote' }}
        secondaryButton={{ text: 'Nous contacter', href: '/contact' }}
      />
    </>
  );
}
