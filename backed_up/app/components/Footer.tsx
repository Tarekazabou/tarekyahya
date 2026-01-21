import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-about">
            <div className="footer-logo">
              <Image
                src="/assets/logo1_footer.png"
                alt="Primavet"
                className="footer-logo-img"
                width={150}
                height={50}
              />
            </div>
            <p>
              Votre partenaire de confiance pour des produits prêt à porter de qualité supérieure.
              Innovation, savoir-faire et engagement envers l&apos;excellence.
            </p>
            <div className="footer-social">
              <a href="#" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" aria-label="LinkedIn">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-title">Liens Rapides</h4>
            <ul className="footer-links">
              <li><Link href="/">Accueil</Link></li>
              <li><Link href="/about">À propos</Link></li>
              <li><Link href="/products">Collections</Link></li>
              <li><Link href="/showroom">Outfit</Link></li>
              <li><Link href="/news">Actualités</Link></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-title">Services</h4>
            <ul className="footer-links">
              <li><Link href="/quote">Demande de devis</Link></li>
              <li><Link href="/quote">Passer commande</Link></li>
              <li><Link href="/recruitment">Recrutement</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/suggestion">Suggestion</Link></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-title">Contact</h4>
            <ul className="footer-contact">
              <li>
                <i className="fas fa-map-marker-alt"></i>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Rue+Saad+Ibn+Waqas+Kalâa+Seghira+Tunisie"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  Rue Saad Ibn Waqas<br />Kalâa Seghira (4021), Tunisie
                </a>
              </li>
              <li>
                <i className="fas fa-phone"></i>
                <span>
                  Fixe: <a href="tel:+21636110027" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}>36 110 027</a> |
                  Mobile: <a href="tel:+21625500780" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}>25 500 780</a>
                </span>
              </li>
              <li>
                <i className="fas fa-envelope"></i>
                <a href="mailto:Societe@primavet.tn" style={{ textDecoration: 'none', color: 'inherit' }}>
                  Societe@primavet.tn
                </a>
              </li>
              <li>
                <i className="fas fa-clock"></i>
                <span>Lun - Ven: 8h00 - 17h00</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 Primavet. Tous droits réservés.</p>
          <div className="footer-bottom-links">
            <a href="#">Mentions légales</a>
            <a href="#">Politique de confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
