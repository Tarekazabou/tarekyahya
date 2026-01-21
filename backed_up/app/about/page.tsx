import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '../components/PageHeader';
import CTABanner from '../components/CTABanner';

export const metadata: Metadata = {
  title: 'À propos | Primavet - Prêt à Porter de Qualité',
  description: "Découvrez l'histoire, la mission et les valeurs de Primavet, entreprise spécialisée dans le prêt à porter de qualité.",
  keywords: 'Primavet, à propos, histoire, mission, valeurs, prêt à porter',
};

export default function AboutPage() {
  return (
    <>
      <PageHeader title="À propos de Primavet" breadcrumb="À propos" />

      {/* About Section */}
      <section className="about section">
        <div className="container">
          <div className="about-content">
            <div className="about-image">
              <div
                style={{
                  width: '100%',
                  height: '450px',
                  background: 'linear-gradient(135deg, #1a2744 0%, #4a6fa5 50%, #6b8cce 100%)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 25px 50px rgba(26, 39, 68, 0.25)',
                }}
              >
                <i className="fas fa-building" style={{ fontSize: '8rem', color: 'rgba(255,255,255,0.9)' }}></i>
              </div>
            </div>
            <div className="about-text">
              <h2>Notre Histoire</h2>
              <p>
                Fondée en 2015, Primavet SARL, située à Kalaâ Sghira, est née d&apos;une passion pour le prêt-à-porter
                et d&apos;une volonté constante d&apos;offrir des produits alliant qualité, style et fiabilité.
              </p>
              <p>
                Depuis sa création, Primavet s&apos;est positionnée comme un acteur engagé dans le développement et la
                distribution de collections de vêtements, conçues principalement pour une clientèle B2B du secteur,
                sur commande et sur mesure, selon des besoins spécifiques.
              </p>
              <p>Au fil des années, l&apos;entreprise a su construire une solide réputation grâce à :</p>
              <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem', color: 'var(--gray)' }}>
                <li>La qualité de ses articles</li>
                <li>Sa capacité d&apos;adaptation aux tendances du marché</li>
                <li>Un service commercial orienté satisfaction client</li>
              </ul>
              <p>
                Portée par une croissance progressive et maîtrisée, Primavet continue d&apos;évoluer en proposant des
                solutions adaptées aux besoins de ses partenaires, tout en renforçant ses relations commerciales et
                son ancrage sur le marché national.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision Section */}
      <section className="section section-bg">
        <div className="container">
          <div className="section-title">
            <h2>Notre Mission & Vision</h2>
            <p>Ce qui nous guide au quotidien dans notre engagement envers l&apos;excellence prêt à porter.</p>
          </div>

          <div className="row" style={{ gap: '2rem', flexWrap: 'wrap', display: 'flex' }}>
            <div className="col" style={{ flex: 1, minWidth: '300px' }}>
              <div className="value-card" style={{ height: '100%' }}>
                <h4>
                  <i className="fas fa-bullseye" style={{ marginRight: '10px', color: 'var(--primary-light)' }}></i>
                  Notre Mission
                </h4>
                <p>
                  Améliorer la performance des marques tunisiennes de prêt-à-porter en renforçant leur distribution
                  et leur présence sur le marché.
                </p>
                <p style={{ marginBottom: 0 }}>
                  Proposer des produits qui apportent élégance, confort et confiance en soi aux consommateurs
                  tunisiens.
                </p>
              </div>
            </div>

            <div className="col" style={{ flex: 1, minWidth: '300px' }}>
              <div className="value-card" style={{ height: '100%' }}>
                <h4>
                  <i className="fas fa-eye" style={{ marginRight: '10px', color: 'var(--primary-light)' }}></i>
                  Notre Vision
                </h4>
                <p>
                  Renforcer notre position sur le marché prêt à porter tunisien en devenant un partenaire
                  incontournable des marques locales.
                </p>
                <p style={{ marginBottom: 0 }}>
                  Développer Primavet à l&apos;échelle internationale en exportant notre savoir-faire, en innovant dans
                  nos procédés et en construisant une image de marque capable de rivaliser sur les marchés mondiaux
                  du prêt-à-porter.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section section-bg">
        <div className="container">
          <div className="section-title">
            <h2>Nos Valeurs</h2>
            <p>Les principes fondamentaux qui définissent notre identité et guident nos actions.</p>
          </div>

          <div className="values-grid">
            <div className="value-card">
              <h4>
                <i className="fas fa-gem" style={{ marginRight: '10px', color: 'var(--primary-light)' }}></i>
                Qualité
              </h4>
              <p>
                La qualité est au cœur de tout ce que nous faisons. Nous sélectionnons rigoureusement nos
                matériaux et contrôlons chaque étape de production pour garantir des produits d&apos;excellence.
              </p>
            </div>

            <div className="value-card">
              <h4>
                <i className="fas fa-lightbulb" style={{ marginRight: '10px', color: 'var(--primary-light)' }}></i>
                Innovation
              </h4>
              <p>
                Nous restons à l&apos;écoute des tendances et investissons dans la recherche pour proposer des
                collections modernes et des solutions innovantes à nos clients.
              </p>
            </div>

            <div className="value-card">
              <h4>
                <i className="fas fa-users" style={{ marginRight: '10px', color: 'var(--primary-light)' }}></i>
                Engagement Client
              </h4>
              <p>
                La satisfaction de nos clients est notre priorité. Nous construisons des relations de confiance
                basées sur l&apos;écoute, la réactivité et le respect des engagements.
              </p>
            </div>

            <div className="value-card">
              <h4>
                <i className="fas fa-handshake" style={{ marginRight: '10px', color: 'var(--primary-light)' }}></i>
                Intégrité
              </h4>
              <p>
                Nous agissons avec honnêteté et transparence dans toutes nos relations commerciales, en
                respectant nos partenaires, clients et collaborateurs.
              </p>
            </div>

            <div className="value-card">
              <h4>
                <i className="fas fa-leaf" style={{ marginRight: '10px', color: 'var(--primary-light)' }}></i>
                Responsabilité
              </h4>
              <p>
                Conscients de notre impact, nous nous engageons dans une démarche responsable, en privilégiant
                des pratiques durables et respectueuses de l&apos;environnement.
              </p>
            </div>

            <div className="value-card">
              <h4>
                <i className="fas fa-chart-line" style={{ marginRight: '10px', color: 'var(--primary-light)' }}></i>
                Excellence
              </h4>
              <p>
                Nous visons l&apos;excellence dans tous les aspects de notre activité, de la conception des produits à
                la livraison, en passant par le service client.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section section-bg">
        <div className="container">
          <div className="section-title">
            <h2>Notre Équipe</h2>
            <p>Des professionnels passionnés au service de votre réussite.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-user-tie"></i>
              </div>
              <h3>Direction</h3>
              <p>
                Une équipe de direction expérimentée, assurant le pilotage stratégique de l&apos;entreprise et
                orientant ses actions vers l&apos;excellence opérationnelle et l&apos;innovation continue.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-cogs"></i>
              </div>
              <h3>Production / Technique & Logistique</h3>
              <p>
                Une équipe technique et logistique compétente, garantissant la qualité des réalisations,
                l&apos;optimisation des processus et le respect strict des délais de production et de livraison.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3>Marketing & Vente</h3>
              <p>
                Un pôle dédié à la création de collections adaptées au marché et à l&apos;accompagnement personnalisé
                des clients, de la conception à la commercialisation.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-headset"></i>
              </div>
              <h3>Service Client</h3>
              <p>
                Un service client réactif et professionnel, garantissant un accompagnement de qualité après-vente
                et une relation client durable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="section">
        <div className="container">
          <div className="features-grid" style={{ textAlign: 'center' }}>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-calendar-alt"></i>
              </div>
              <h3 style={{ fontSize: '2.5rem', color: 'var(--primary-color)' }}>10+</h3>
              <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Années d&apos;expérience</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-smile"></i>
              </div>
              <h3 style={{ fontSize: '2.5rem', color: 'var(--primary-color)' }}>500+</h3>
              <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Clients satisfaits</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-box-open"></i>
              </div>
              <h3 style={{ fontSize: '2.5rem', color: 'var(--primary-color)' }}>1000+</h3>
              <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Produits livrés</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-globe"></i>
              </div>
              <h3 style={{ fontSize: '2.5rem', color: 'var(--primary-color)' }}>20+</h3>
              <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Pays desservis</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <CTABanner
        title="Rejoignez l'aventure Primavet"
        description="Vous souhaitez travailler avec une équipe passionnée ? Découvrez nos opportunités de carrière."
        primaryButton={{ text: 'Voir les offres', href: '/recruitment' }}
        secondaryButton={{ text: 'Nous contacter', href: '/contact' }}
      />
    </>
  );
}
