import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  breadcrumb?: string;
}

export default function PageHeader({ title, breadcrumb }: PageHeaderProps) {
  return (
    <section className="page-header">
      <div className="container">
        <h1>{title}</h1>
        <nav className="breadcrumb">
          <Link href="/">Accueil</Link>
          <span>/</span>
          <span>{breadcrumb || title}</span>
        </nav>
      </div>
    </section>
  );
}
