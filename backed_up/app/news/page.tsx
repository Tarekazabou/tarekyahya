'use client';

import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import NewsCard from '../components/NewsCard';
import CTABanner from '../components/CTABanner';
import { getNewsPaginated, NewsArticle, PaginatedResult } from '../lib/data-service';

// Mock news data
const mockNews: NewsArticle[] = [
  {
    id: 1,
    title: 'Lancement de la Collection Printemps 2025',
    content: 'Découvrez notre nouvelle collection printanière avec des couleurs fraîches et des designs innovants qui marquent le début d\'une nouvelle saison de mode.',
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
    content: 'Primavet sera présent au prochain salon international du textile pour présenter ses dernières innovations.',
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
    content: 'Notre engagement envers des pratiques durables et respectueuses de l\'environnement se concrétise par de nouvelles initiatives.',
    excerpt: 'Notre engagement envers des pratiques durables et respectueuses de l\'environnement.',
    category: 'Développement Durable',
    author: 'Primavet',
    published_at: '2025-01-05',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    icon: 'fa-leaf',
    is_featured: true,
  },
  {
    id: 4,
    title: 'Nouveau Partenariat Stratégique',
    content: 'Primavet annonce un nouveau partenariat avec une marque internationale pour élargir sa présence sur le marché.',
    excerpt: 'Primavet annonce un nouveau partenariat avec une marque internationale.',
    category: 'Partenariat',
    author: 'Primavet',
    published_at: '2025-01-01',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    icon: 'fa-handshake',
    is_featured: false,
  },
  {
    id: 5,
    title: 'Innovation dans les Tissus Techniques',
    content: 'Découvrez nos nouveaux tissus techniques qui allient confort, durabilité et style pour répondre aux besoins modernes.',
    excerpt: 'Découvrez nos nouveaux tissus techniques qui allient confort, durabilité et style.',
    category: 'Innovation',
    author: 'Primavet',
    published_at: '2024-12-20',
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    icon: 'fa-lightbulb',
    is_featured: false,
  },
];

export default function NewsPage() {
  const [news, setNews] = useState<NewsArticle[]>(mockNews);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    count: mockNews.length,
  });

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async (page = 1, search: string | null = null) => {
    setLoading(true);
    try {
      const result: PaginatedResult<NewsArticle> = await getNewsPaginated(page, 6, search);
      if (result.data.length > 0) {
        setNews(result.data);
        setPagination({
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          count: result.count,
        });
      } else {
        setNews(mockNews);
      }
    } catch {
      setNews(mockNews);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadNews(1, searchTerm || null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
      <PageHeader title="Actualités & Blog" breadcrumb="Actualités" />

      {/* News Section */}
      <section className="news section">
        <div className="container">
          {/* Search Bar */}
          <div className="search-container" style={{ marginBottom: '2rem' }}>
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              <div className="form-group" style={{ position: 'relative' }}>
                <input
                  type="text"
                  id="news-search"
                  placeholder="Rechercher une actualité..."
                  style={{ paddingRight: '50px' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyUp={handleKeyPress}
                />
                <button
                  onClick={handleSearch}
                  style={{
                    position: 'absolute',
                    right: '5px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <i className="fas fa-search"></i>
                </button>
              </div>
            </div>
          </div>

          <div className="blog-layout">
            {/* Main Content */}
            <div className="blog-main">
              <div className="news-grid" id="news-grid" style={{ gridTemplateColumns: '1fr' }}>
                {loading ? (
                  <div className="loading-spinner" style={{ textAlign: 'center', padding: '3rem' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}></i>
                    <p style={{ marginTop: '1rem', color: 'var(--gray)' }}>Chargement des actualités...</p>
                  </div>
                ) : news.length === 0 ? (
                  <p className="no-results" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray)' }}>
                    Aucune actualité trouvée.
                  </p>
                ) : (
                  news.map((article) => <NewsCard key={article.id} article={article} />)
                )}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => loadNews(page)}
                      className={`pagination-btn ${page === pagination.currentPage ? 'active' : ''}`}
                      style={{
                        padding: '0.5rem 1rem',
                        border: `1px solid ${page === pagination.currentPage ? 'var(--primary-color)' : '#e2e8f0'}`,
                        borderRadius: '8px',
                        background: page === pagination.currentPage ? 'var(--primary-color)' : 'white',
                        color: page === pagination.currentPage ? 'white' : 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="blog-sidebar">
              {/* Categories Widget */}
              <div className="sidebar-widget">
                <h4>Catégories</h4>
                <ul className="category-list">
                  <li><a href="#">Collection <span>(8)</span></a></li>
                  <li><a href="#">Événement <span>(5)</span></a></li>
                  <li><a href="#">Développement Durable <span>(3)</span></a></li>
                  <li><a href="#">Partenariat <span>(4)</span></a></li>
                  <li><a href="#">Innovation <span>(6)</span></a></li>
                  <li><a href="#">Récompense <span>(2)</span></a></li>
                </ul>
              </div>

              {/* Recent Posts Widget */}
              <div className="sidebar-widget">
                <h4>Articles Récents</h4>
                <ul className="category-list">
                  <li><a href="#">Lancement Collection Printemps 2025</a></li>
                  <li><a href="#">Salon du Prêt à Porter 2025</a></li>
                  <li><a href="#">Engagement Éco-Responsable</a></li>
                  <li><a href="#">Nouveau Partenariat</a></li>
                </ul>
              </div>

              {/* Social Widget */}
              <div className="sidebar-widget">
                <h4>Suivez-nous</h4>
                <div className="footer-social" style={{ justifyContent: 'flex-start' }}>
                  <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
                  <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                  <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
                </div>
              </div>

              {/* Newsletter Widget */}
              <div className="sidebar-widget">
                <h4>Newsletter</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>
                  Inscrivez-vous pour recevoir nos actualités.
                </p>
                <form action="#" method="post">
                  <div className="form-group">
                    <input type="email" placeholder="Votre e-mail" required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    S&apos;inscrire
                  </button>
                </form>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <CTABanner
        title="Restez informé de nos actualités"
        description="Suivez-nous sur les réseaux sociaux pour ne rien manquer de nos nouveautés."
        primaryButton={{ text: 'Facebook', href: '#' }}
        secondaryButton={{ text: 'Instagram', href: '#' }}
      />
    </>
  );
}
