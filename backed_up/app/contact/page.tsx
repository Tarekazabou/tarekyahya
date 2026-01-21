'use client';

import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import CTABanner from '../components/CTABanner';
import { submitContactForm } from '../lib/data-service';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await submitContactForm({
        form_type: 'contact',
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        message: formData.message,
        subject: formData.subject || null,
      });

      if (result.success) {
        setSuccess(true);
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setError(result.error || 'Une erreur est survenue');
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Contact & Localisation" breadcrumb="Contact" />

      {/* Contact Section */}
      <section className="contact section">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Info */}
            <div className="contact-info">
              <h2>Contactez-nous</h2>
              <p>
                Nous sommes à votre disposition pour répondre à toutes vos questions. N&apos;hésitez pas à nous
                contacter via le formulaire ou par les coordonnées ci-dessous.
              </p>

              <div className="contact-item">
                <div className="contact-icon">
                  <i className="fas fa-map-marker-alt"></i>
                </div>
                <div>
                  <h4>Adresse</h4>
                  <p>Rue Saad Ibn Waqas<br />Kalâa Seghira (4021), Tunisie</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">
                  <i className="fas fa-phone"></i>
                </div>
                <div>
                  <h4>Téléphone</h4>
                  <p>Fixe: 36 110 027<br />Mobile: 25 500 780</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">
                  <i className="fas fa-envelope"></i>
                </div>
                <div>
                  <h4>E-mail</h4>
                  <p>Societe@primavet.tn<br />Recrutement: Samirozar@gmail.com</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div>
                  <h4>Horaires d&apos;ouverture</h4>
                  <p>Lundi - Vendredi: 8h00 - 17h00<br />Samedi: 8h00 - 13h00<br />Dimanche: Fermé</p>
                </div>
              </div>

              {/* Social Media */}
              <div style={{ marginTop: 'var(--spacing-xl)' }}>
                <h4 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--primary-color)' }}>Suivez-nous</h4>
                <div className="footer-social" style={{ justifyContent: 'flex-start' }}>
                  <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
                  <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                  <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form">
              <h3 style={{ color: 'var(--primary-color)', marginBottom: 'var(--spacing-lg)' }}>
                Envoyez-nous un message
              </h3>

              {success && (
                <div style={{ background: '#22c55e', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
                  <strong>✓ Message envoyé avec succès!</strong>
                </div>
              )}

              {error && (
                <div style={{ background: '#ef4444', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
                  <strong>{error}</strong>
                </div>
              )}

              <form onSubmit={handleSubmit} id="contactForm">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Nom complet *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Votre nom"
                      required
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">E-mail *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Votre e-mail"
                      required
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Téléphone</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      placeholder="Votre téléphone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="subject">Sujet</label>
                    <select id="subject" name="subject" value={formData.subject} onChange={handleChange}>
                      <option value="">Sélectionnez un sujet</option>
                      <option value="information">Demande d&apos;information</option>
                      <option value="devis">Demande de devis</option>
                      <option value="partenariat">Partenariat</option>
                      <option value="reclamation">Réclamation</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Votre message..."
                    required
                    value={formData.message}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? 'Envoi en cours...' : 'Envoyer le message'}
                </button>
              </form>
            </div>
          </div>

          {/* Map */}
          <div className="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12888.7!2d10.3468!3d35.7931!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12fd8bcf5b5b1b1b%3A0x7b7b7b7b7b7b7b7b!2sKal%C3%A2a%20Seghira%2C%20Tunisia!5e0!3m2!1sfr!2stn!4v1704480000000!5m2!1sfr!2stn"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localisation Primavet - Kalâa Seghira, Tunisie"
            ></iframe>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <CTABanner
        title="Besoin d'un devis rapide ?"
        description="Remplissez notre formulaire de demande de devis et recevez une réponse sous 24h."
        primaryButton={{ text: 'Demander un devis', href: '/quote' }}
      />
    </>
  );
}
