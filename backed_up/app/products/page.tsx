'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '../components/PageHeader';
import ProductCard from '../components/ProductCard';
import CTABanner from '../components/CTABanner';
import { getProductsPaginated, Product, PaginatedResult } from '../lib/data-service';

// Mock data for initial render
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
  {
    id: 4,
    name: 'Été 2025',
    description: 'Collection légère et colorée pour l\'été',
    category: 'femme',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    icon: 'fa-sun',
    is_featured: false,
    sort_order: 4,
  },
  {
    id: 5,
    name: 'Business Line',
    description: 'Tenues professionnelles élégantes',
    category: 'homme',
    gradient: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
    icon: 'fa-briefcase',
    is_featured: false,
    sort_order: 5,
  },
  {
    id: 6,
    name: 'Casual Chic',
    description: 'Le confort au quotidien',
    category: 'femme',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
    icon: 'fa-heart',
    is_featured: false,
    sort_order: 6,
  },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [category, setCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    count: mockProducts.length,
  });

  useEffect(() => {
    loadProducts();
  }, [category]);

  const loadProducts = async (page = 1, search: string | null = null) => {
    setLoading(true);
    try {
      const result: PaginatedResult<Product> = await getProductsPaginated(page, 9, category, search);
      if (result.data.length > 0) {
        setProducts(result.data);
        setPagination({
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          count: result.count,
        });
      } else {
        // Use mock data if no results from API
        const filtered = category
          ? mockProducts.filter((p) => p.category === category)
          : mockProducts;
        setProducts(filtered);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          count: filtered.length,
        });
      }
    } catch {
      // Use mock data on error
      const filtered = category
        ? mockProducts.filter((p) => p.category === category)
        : mockProducts;
      setProducts(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadProducts(1, searchTerm || null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCategoryFilter = (cat: string | null) => {
    setCategory(cat);
  };

  return (
    <>
      <PageHeader title="Nos Produits" breadcrumb="Produits" />

      {/* Products Section */}
      <section className="products section">
        <div className="container">
          <div className="section-title">
            <h2>Notre Catalogue</h2>
            <p>Explorez notre gamme complète de produits prêt à porter de haute qualité, organisés par catégorie.</p>
          </div>

          {/* Search Bar */}
          <div className="search-container" style={{ marginBottom: '2rem' }}>
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              <div className="form-group" style={{ position: 'relative' }}>
                <input
                  type="text"
                  id="products-search"
                  placeholder="Rechercher un produit..."
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

          {/* Filter Buttons */}
          <div className="products-filter">
            <button
              className={`filter-btn ${category === null ? 'active' : ''}`}
              onClick={() => handleCategoryFilter(null)}
            >
              Tous
            </button>
            <button
              className={`filter-btn ${category === 'homme' ? 'active' : ''}`}
              onClick={() => handleCategoryFilter('homme')}
            >
              Homme
            </button>
            <button
              className={`filter-btn ${category === 'femme' ? 'active' : ''}`}
              onClick={() => handleCategoryFilter('femme')}
            >
              Femme
            </button>
          </div>

          {/* Products Grid */}
          <div className="products-grid" id="products-grid">
            {loading ? (
              <div className="loading-spinner" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}></i>
                <p style={{ marginTop: '1rem', color: 'var(--gray)' }}>Chargement des produits...</p>
              </div>
            ) : products.length === 0 ? (
              <p className="no-results" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: 'var(--gray)' }}>
                Aucun produit trouvé.
              </p>
            ) : (
              products.map((product) => <ProductCard key={product.id} product={product} />)
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => loadProducts(page)}
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
      </section>

      {/* Services Section */}
      <section className="section section-bg">
        <div className="container">
          <div className="section-title">
            <h2>Nos Services</h2>
            <p>En plus de nos produits, nous proposons des services adaptés à vos besoins.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-palette"></i>
              </div>
              <h3>Personnalisation</h3>
              <p>Personnalisez vos vêtements avec votre logo, couleurs et designs sur mesure.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-box"></i>
              </div>
              <h3>Commandes en Gros</h3>
              <p>Tarifs préférentiels pour les commandes en grande quantité.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-truck-fast"></i>
              </div>
              <h3>Livraison Express</h3>
              <p>Service de livraison rapide pour vos commandes urgentes.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-comments"></i>
              </div>
              <h3>Conseil Expert</h3>
              <p>Notre équipe vous accompagne dans le choix de vos produits prêt à porter.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <CTABanner
        title="Besoin d'un devis personnalisé ?"
        description="Contactez-nous pour obtenir un devis adapté à vos besoins spécifiques."
        primaryButton={{ text: 'Demander un devis', href: '/quote' }}
        secondaryButton={{ text: 'Nous contacter', href: '/contact' }}
      />
    </>
  );
}
