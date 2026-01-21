import type { Metadata } from 'next';
import PageHeader from '../components/PageHeader';
import CTABanner from '../components/CTABanner';

export const metadata: Metadata = {
  title: 'Showroom | Primavet - Prêt à Porter de Qualité',
  description: 'Visitez le showroom Primavet et découvrez nos collections et réalisations prêt à porter de haute qualité.',
  keywords: 'Primavet, showroom, galerie, collections, réalisations, prêt à porter',
};

const showroomItems = [
  { title: 'Collection Printemps 2024', description: 'Nouvelle collection de vêtements légers et colorés', category: 'collection', gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', icon: 'fa-tshirt' },
  { title: 'Collection Été 2024', description: 'Vêtements frais et confortables pour l\'été', category: 'collection', gradient: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)', icon: 'fa-vest' },
  { title: 'Collection Automne 2024', description: 'Tons chauds et matières douces', category: 'collection', gradient: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)', icon: 'fa-user-tie' },
  { title: 'Collection Hiver 2024', description: 'Vêtements chauds et élégants', category: 'collection', gradient: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)', icon: 'fa-mitten' },
  { title: 'Uniforme Entreprise ABC', description: 'Réalisation complète d\'uniformes corporate', category: 'realisation', gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', icon: 'fa-industry' },
  { title: 'Tenues Hôtel Luxe', description: 'Collection complète pour chaîne hôtelière', category: 'realisation', gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', icon: 'fa-hotel' },
  { title: 'Uniformes Restaurant Étoilé', description: 'Tenues personnalisées pour la haute gastronomie', category: 'realisation', gradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)', icon: 'fa-utensils' },
  { title: 'Boutique Mode Paris', description: 'Collection exclusive pour boutique parisienne', category: 'realisation', gradient: 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)', icon: 'fa-store' },
  { title: 'Salon du Prêt à Porter 2024', description: 'Notre présence au salon international', category: 'evenement', gradient: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)', icon: 'fa-calendar-check' },
  { title: 'Prix de l\'Innovation 2024', description: 'Reconnaissance pour nos créations innovantes', category: 'evenement', gradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', icon: 'fa-award' },
  { title: 'Partenariat International', description: 'Nouvelle collaboration avec des marques mondiales', category: 'evenement', gradient: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)', icon: 'fa-handshake' },
  { title: 'Journée Portes Ouvertes', description: 'Visite de nos ateliers de production', category: 'evenement', gradient: 'linear-gradient(135deg, #854d0e 0%, #a16207 100%)', icon: 'fa-users' },
];

export default function ShowroomPage() {
  return (
    <>
      <PageHeader title="Showroom & Réalisations" breadcrumb="Showroom" />

      {/* Showroom Introduction */}
      <section className="section">
        <div className="container">
          <div className="section-title">
            <h2>Nos Collections</h2>
            <p>Découvrez nos réalisations et collections à travers notre galerie. Cliquez sur une image pour l&apos;agrandir.</p>
          </div>

          {/* Filter */}
          <div className="products-filter">
            <button className="filter-btn active" data-filter="all">Toutes</button>
            <button className="filter-btn" data-filter="collection">Collections</button>
            <button className="filter-btn" data-filter="realisation">Réalisations</button>
            <button className="filter-btn" data-filter="evenement">Événements</button>
          </div>
        </div>
      </section>

      {/* Showroom Gallery */}
      <section className="showroom section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="showroom-grid">
            {showroomItems.map((item, index) => (
              <div key={index} className="showroom-item" data-category={item.category}>
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: item.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <i className={`fas ${item.icon}`} style={{ fontSize: '5rem', color: 'white' }}></i>
                </div>
                <div className="showroom-overlay">
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section section-bg">
        <div className="container">
          <div className="about-content">
            <div className="about-text" style={{ maxWidth: '100%' }}>
              <h2>Visitez notre Showroom</h2>
              <p>
                Découvrez l&apos;ensemble de nos collections en personne dans notre showroom situé à Kalâa Seghira. Notre
                équipe se fera un plaisir de vous accueillir et de vous présenter nos dernières créations.
              </p>
              <p>Prenez rendez-vous pour une visite personnalisée et découvrez le savoir-faire Primavet.</p>

              <div className="about-features" style={{ gridTemplateColumns: '1fr' }}>
                <div className="about-feature">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>Rue Saad Ibn Waqas, Kalâa Seghira (4021), Tunisie</span>
                </div>
                <div className="about-feature">
                  <i className="fas fa-clock"></i>
                  <span>Lundi - Vendredi : 8h00 - 17h00 | Samedi : 8h00 - 13h00</span>
                </div>
                <div className="about-feature">
                  <i className="fas fa-phone"></i>
                  <span>Fixe: 36 110 027 | Mobile: 25 500 780</span>
                </div>
              </div>

              <a href="/contact" className="btn btn-primary mt-2">
                Prendre rendez-vous
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <CTABanner
        title="Intéressé par nos créations ?"
        description="Contactez-nous pour discuter de vos projets et obtenir un devis personnalisé."
        primaryButton={{ text: 'Demander un devis', href: '/quote' }}
        secondaryButton={{ text: 'Nous contacter', href: '/contact' }}
      />
    </>
  );
}
