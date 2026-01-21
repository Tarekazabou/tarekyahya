import Link from 'next/link';

interface ProductCardProps {
  product: {
    name: string;
    description: string;
    category: string;
    gradient: string;
    icon: string;
    badge?: string;
  };
  featured?: boolean;
}

// Sanitize gradient to prevent XSS
function sanitizeGradient(gradient: string | null): string {
  if (!gradient) return 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)';
  const safePattern = /^linear-gradient\(\s*\d+deg\s*,\s*(#[a-fA-F0-9]{3,6}\s+\d+%\s*,?\s*)+\)$/;
  if (safePattern.test(gradient)) {
    return gradient;
  }
  return 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)';
}

// Sanitize icon class
function sanitizeIcon(icon: string | null): string {
  if (!icon) return 'fa-box';
  const safePattern = /^fa-[a-z0-9-]+$/;
  if (safePattern.test(icon)) {
    return icon;
  }
  return 'fa-box';
}

// Capitalize first letter
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function ProductCard({ product, featured = false }: ProductCardProps) {
  return (
    <div className="product-card" data-category={product.category}>
      <div className="product-image">
        <div
          style={{
            width: '100%',
            height: '100%',
            background: sanitizeGradient(product.gradient),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className={`fas ${sanitizeIcon(product.icon)}`} style={{ fontSize: '4rem', color: 'white' }}></i>
        </div>
        {product.badge && <span className="product-badge">{product.badge}</span>}
      </div>
      <div className="product-content">
        <span className="product-category">{capitalizeFirst(product.category)}</span>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="product-actions">
          <Link href="/quote" className="btn btn-primary">
            {featured ? 'Devis' : 'Demander un devis'}
          </Link>
          <Link href={featured ? '/products' : '/quote'} className="btn btn-secondary">
            {featured ? 'Détails' : 'Commander'}
          </Link>
        </div>
      </div>
    </div>
  );
}
