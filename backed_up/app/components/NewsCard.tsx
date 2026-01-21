import Link from 'next/link';

interface NewsCardProps {
  article: {
    title: string;
    content?: string;
    excerpt?: string;
    category: string;
    author: string;
    published_at: string;
    gradient: string;
    icon: string;
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
  if (!icon) return 'fa-newspaper';
  const safePattern = /^fa-[a-z0-9-]+$/;
  if (safePattern.test(icon)) {
    return icon;
  }
  return 'fa-newspaper';
}

// Format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('fr-FR', options);
}

export default function NewsCard({ article, featured = false }: NewsCardProps) {
  const excerptText = article.excerpt || (article.content ? article.content.substring(0, featured ? 150 : 200) + '...' : '');

  if (featured) {
    return (
      <article className="news-card">
        <div className="news-image">
          <div
            style={{
              width: '100%',
              height: '100%',
              background: sanitizeGradient(article.gradient),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className={`fas ${sanitizeIcon(article.icon)}`} style={{ fontSize: '3rem', color: 'white' }}></i>
          </div>
        </div>
        <div className="news-content">
          <div className="news-meta">
            <span><i className="far fa-calendar"></i> {formatDate(article.published_at)}</span>
            <span><i className="far fa-folder"></i> {article.category}</span>
          </div>
          <h3><Link href="/news">{article.title}</Link></h3>
          <p>{excerptText}</p>
          <Link href="/news" className="news-link">
            Lire la suite <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="news-card" style={{ display: 'flex', flexDirection: 'row', gap: '2rem' }}>
      <div className="news-image" style={{ width: '300px', minWidth: '300px', height: '200px' }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            background: sanitizeGradient(article.gradient),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className={`fas ${sanitizeIcon(article.icon)}`} style={{ fontSize: '3rem', color: 'white' }}></i>
        </div>
      </div>
      <div className="news-content" style={{ padding: 0 }}>
        <div className="news-meta">
          <span><i className="far fa-calendar"></i> {formatDate(article.published_at)}</span>
          <span><i className="far fa-folder"></i> {article.category}</span>
          <span><i className="far fa-user"></i> {article.author}</span>
        </div>
        <h3><a href="#">{article.title}</a></h3>
        <p>{excerptText}</p>
        <a href="#" className="news-link">
          Lire la suite <i className="fas fa-arrow-right"></i>
        </a>
      </div>
    </article>
  );
}
