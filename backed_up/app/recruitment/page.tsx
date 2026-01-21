import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '../components/PageHeader';
import CTABanner from '../components/CTABanner';

export const metadata: Metadata = {
  title: 'Recrutement | Primavet - Prêt à Porter de Qualité',
  description: 'Rejoignez l\'équipe Primavet. Découvrez nos offres d\'emploi et postulez en ligne.',
  keywords: 'Primavet, recrutement, emploi, carrière, offres, postuler',
};

const jobs = [
  {
    title: 'Responsable Commercial',
    location: 'Kalâa Seghira',
    contract: 'CDI',
    experience: '5+ ans d\'expérience',
    description: 'Nous recherchons un(e) Responsable Commercial(e) pour développer notre portefeuille clients et gérer les relations avec nos partenaires.',
  },
  {
    title: 'Designer Prêt à Porter',
    location: 'Kalâa Seghira',
    contract: 'CDI',
    experience: '3+ ans d\'expérience',
    description: 'Rejoignez notre équipe créative pour concevoir des collections innovantes et tendances.',
  },
  {
    title: 'Technicien(ne) de Production',
    location: 'Kalâa Seghira',
    contract: 'CDI',
    experience: '2+ ans d\'expérience',
    description: 'Assurez le bon fonctionnement de nos équipements de production et le contrôle qualité.',
  },
  {
    title: 'Assistant(e) Marketing Digital',
    location: 'Kalâa Seghira',
    contract: 'CDD',
    experience: '1+ an d\'expérience',
    description: 'Participez au développement de notre présence digitale et à nos campagnes marketing.',
  },
  {
    title: 'Stage - Développement Produit',
    location: 'Kalâa Seghira',
    contract: 'Stage (6 mois)',
    experience: 'Étudiant Bac+4/5',
    description: 'Intégrez notre équipe R&D et participez au développement de nouveaux produits prêt à porter.',
  },
];

export default function RecruitmentPage() {
  return (
    <>
      <PageHeader title="Recrutement" breadcrumb="Recrutement" />

      {/* Recruitment Intro */}
      <section className="section">
        <div className="container">
          <div className="section-title" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h2>Rejoignez notre équipe</h2>
            <p>
              Chez Primavet, nous croyons que notre succès repose sur nos collaborateurs. Nous recherchons des
              talents passionnés, créatifs et engagés pour rejoindre notre équipe dynamique.
            </p>
            <p>
              Nous offrons un environnement de travail stimulant, des opportunités de développement
              professionnel et une culture d&apos;entreprise basée sur le respect, l&apos;innovation et l&apos;excellence.
            </p>
          </div>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="section section-bg">
        <div className="container">
          <div className="section-title">
            <h2>Pourquoi nous rejoindre ?</h2>
            <p>Découvrez les avantages de travailler chez Primavet.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3>Évolution de Carrière</h3>
              <p>Des opportunités de progression et de développement professionnel au sein de l&apos;entreprise.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-users"></i>
              </div>
              <h3>Équipe Dynamique</h3>
              <p>Une équipe passionnée et solidaire dans un environnement de travail convivial.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-graduation-cap"></i>
              </div>
              <h3>Formation Continue</h3>
              <p>Des programmes de formation pour développer vos compétences et expertise.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-heart"></i>
              </div>
              <h3>Bien-être au Travail</h3>
              <p>Un environnement sain et équilibré favorisant le bien-être de nos collaborateurs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="recruitment section">
        <div className="container">
          <div className="section-title">
            <h2>Nos Offres d&apos;Emploi</h2>
            <p>Découvrez les postes actuellement ouverts et postulez directement en ligne.</p>
          </div>

          <div className="jobs-grid">
            {jobs.map((job, index) => (
              <div key={index} className="job-card">
                <div className="job-info">
                  <h3>{job.title}</h3>
                  <div className="job-meta">
                    <span><i className="fas fa-map-marker-alt"></i> {job.location}</span>
                    <span><i className="fas fa-clock"></i> {job.contract}</span>
                    <span><i className="fas fa-briefcase"></i> {job.experience}</span>
                  </div>
                  <p>{job.description}</p>
                </div>
                <Link href="#application-form" className="btn btn-primary">Postuler</Link>
              </div>
            ))}
          </div>

          {/* Recruitment Contact Note */}
          <div style={{ textAlign: 'center', marginTop: '2rem', padding: '1.5rem', background: 'var(--light-gray)', borderRadius: '12px' }}>
            <p style={{ margin: 0, color: 'var(--gray)' }}>
              <i className="fas fa-envelope" style={{ color: 'var(--primary-color)', marginRight: '0.5rem' }}></i>
              Pour toute candidature spontanée, envoyez votre CV à{' '}
              <a href="mailto:Samirozar@gmail.com" style={{ color: 'var(--primary-color)', fontWeight: 500 }}>
                Samirozar@gmail.com
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="section section-bg" id="application-form">
        <div className="container">
          <div className="application-form" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3 style={{ textAlign: 'center' }}>Formulaire de Candidature</h3>
            <p style={{ textAlign: 'center', color: 'var(--gray)', marginBottom: 'var(--spacing-xl)' }}>
              Remplissez le formulaire ci-dessous pour postuler à l&apos;une de nos offres.
            </p>

            <form action="#" method="post" id="applicationForm">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="candidate-name">Nom complet *</label>
                  <input type="text" id="candidate-name" name="name" placeholder="Votre nom" required />
                </div>
                <div className="form-group">
                  <label htmlFor="candidate-email">E-mail *</label>
                  <input type="email" id="candidate-email" name="email" placeholder="Votre e-mail" required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="candidate-phone">Téléphone *</label>
                  <input type="tel" id="candidate-phone" name="phone" placeholder="Votre téléphone" required />
                </div>
                <div className="form-group">
                  <label htmlFor="candidate-position">Poste souhaité *</label>
                  <select id="candidate-position" name="position" required>
                    <option value="">Sélectionnez un poste</option>
                    <option value="responsable-commercial">Responsable Commercial</option>
                    <option value="designer-pret-a-porter">Designer Prêt à Porter</option>
                    <option value="technicien-production">Technicien(ne) de Production</option>
                    <option value="assistant-marketing">Assistant(e) Marketing Digital</option>
                    <option value="stage-developpement">Stage - Développement Produit</option>
                    <option value="candidature-spontanee">Candidature Spontanée</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="candidate-message">Lettre de motivation</label>
                <textarea
                  id="candidate-message"
                  name="message"
                  placeholder="Présentez-vous et expliquez votre motivation..."
                ></textarea>
              </div>

              <div className="form-group">
                <label>CV (PDF uniquement) *</label>
                <div className="file-upload">
                  <input type="file" id="candidate-cv" name="cv" accept=".pdf" required />
                  <i className="fas fa-cloud-upload-alt"></i>
                  <p>Cliquez ou déposez votre CV ici (PDF, max 5MB)</p>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <button type="submit" className="btn btn-primary btn-lg">Envoyer ma candidature</button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <CTABanner
        title="Aucune offre ne correspond à votre profil ?"
        description="Envoyez-nous une candidature spontanée, nous sommes toujours à la recherche de talents."
        primaryButton={{ text: 'Candidature spontanée', href: '#application-form' }}
        secondaryButton={{ text: 'Nous contacter', href: '/contact' }}
      />
    </>
  );
}
