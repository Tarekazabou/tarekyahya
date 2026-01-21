'use client';

import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { submitQuoteForm } from '../lib/data-service';

export default function QuotePage() {
  const [formData, setFormData] = useState({
    request_type: 'devis',
    name: '',
    email: '',
    phone: '',
    address: '',
    category: '',
    quantity: '',
    product: '',
    details: '',
    customization: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      if (checkbox.checked) {
        setFormData({ ...formData, customization: [...formData.customization, value] });
      } else {
        setFormData({ ...formData, customization: formData.customization.filter((c) => c !== value) });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate quantity
    const qty = parseInt(formData.quantity);
    if (isNaN(qty) || qty < 200) {
      setError('La quantité minimale est de 200 pièces');
      setLoading(false);
      return;
    }

    try {
      const result = await submitQuoteForm({
        form_type: 'quote',
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone,
        message: formData.details,
        product_interest: formData.category,
        quantity: formData.quantity,
        metadata: {
          request_type: formData.request_type,
          address: formData.address,
          product: formData.product,
          customization: formData.customization,
        },
      });

      if (result.success) {
        setSuccess(true);
        setFormData({
          request_type: 'devis',
          name: '',
          email: '',
          phone: '',
          address: '',
          category: '',
          quantity: '',
          product: '',
          details: '',
          customization: [],
        });
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
      <PageHeader title="Demande de Devis & Commande" breadcrumb="Devis" />

      {/* Quote Form Section */}
      <section className="quote section" style={{ background: 'var(--light-gray)' }}>
        <div className="container">
          <div className="quote-content">
            <div className="quote-form">
              <h2>Formulaire de Demande</h2>
              <p style={{ textAlign: 'center', color: 'var(--gray)', marginBottom: 'var(--spacing-xl)' }}>
                Remplissez le formulaire ci-dessous pour recevoir un devis personnalisé ou passer une commande.
                Notre équipe vous répondra sous 24h.
              </p>

              {success && (
                <div style={{ background: '#22c55e', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
                  <strong>✓ Demande envoyée avec succès! Nous vous contacterons sous 24-48h.</strong>
                </div>
              )}

              {error && (
                <div style={{ background: '#ef4444', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
                  <strong>{error}</strong>
                </div>
              )}

              <form onSubmit={handleSubmit} id="quoteForm">
                {/* Request Type */}
                <div className="form-group">
                  <label>Type de demande *</label>
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="request_type"
                        value="devis"
                        checked={formData.request_type === 'devis'}
                        onChange={handleChange}
                        style={{ width: 'auto' }}
                      />
                      <span>Demande de devis</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="request_type"
                        value="commande"
                        checked={formData.request_type === 'commande'}
                        onChange={handleChange}
                        style={{ width: 'auto' }}
                      />
                      <span>Passer une commande</span>
                    </label>
                  </div>
                </div>

                {/* Contact Information */}
                <h4 style={{ color: 'var(--primary-color)', margin: 'var(--spacing-xl) 0 var(--spacing-lg)', borderBottom: '2px solid var(--light-gray)', paddingBottom: 'var(--spacing-sm)' }}>
                  <i className="fas fa-user"></i> Informations de contact
                </h4>

                <div className="form-row">
                  <div className="form-group" style={{ flex: '1 1 100%' }}>
                    <label htmlFor="quote-name">Nom complet *</label>
                    <input
                      type="text"
                      id="quote-name"
                      name="name"
                      placeholder="Votre nom"
                      required
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="quote-email">E-mail</label>
                    <input
                      type="email"
                      id="quote-email"
                      name="email"
                      placeholder="Votre e-mail"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="quote-phone">Téléphone *</label>
                    <input
                      type="tel"
                      id="quote-phone"
                      name="phone"
                      placeholder="Votre téléphone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="quote-address">Adresse de livraison *</label>
                  <input
                    type="text"
                    id="quote-address"
                    name="address"
                    placeholder="Adresse complète"
                    required
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

                {/* Product Information */}
                <h4 style={{ color: 'var(--primary-color)', margin: 'var(--spacing-xl) 0 var(--spacing-lg)', borderBottom: '2px solid var(--light-gray)', paddingBottom: 'var(--spacing-sm)' }}>
                  <i className="fas fa-box"></i> Détails de la demande
                </h4>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="quote-category">Catégorie de produit *</label>
                    <select
                      id="quote-category"
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="">Sélectionnez une catégorie</option>
                      <option value="homme">Collection Homme</option>
                      <option value="femme">Collection Femme</option>
                      <option value="professionnel">Vêtements Professionnels</option>
                      <option value="accessoires">Accessoires</option>
                      <option value="personnalise">Produit Personnalisé</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="quote-quantity">Quantité estimée (min 200) *</label>
                    <input
                      type="number"
                      id="quote-quantity"
                      name="quantity"
                      min="200"
                      step="1"
                      placeholder="Ex: 200"
                      required
                      value={formData.quantity}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: '1 1 100%' }}>
                    <label htmlFor="quote-product">Type de produit souhaité</label>
                    <input
                      type="text"
                      id="quote-product"
                      name="product"
                      placeholder="Ex: Chemises, Polos, Uniformes..."
                      value={formData.product}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Customization Options */}
                <div className="form-group">
                  <label>Options de personnalisation</label>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {['logo', 'couleur', 'taille', 'etiquette'].map((opt) => (
                      <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          name="customization"
                          value={opt}
                          checked={formData.customization.includes(opt)}
                          onChange={handleChange}
                          style={{ width: 'auto' }}
                        />
                        <span>
                          {opt === 'logo' && 'Logo/Broderie'}
                          {opt === 'couleur' && 'Couleurs personnalisées'}
                          {opt === 'taille' && 'Tailles spéciales'}
                          {opt === 'etiquette' && 'Étiquette personnalisée'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="quote-details">Description détaillée de votre demande *</label>
                  <textarea
                    id="quote-details"
                    name="details"
                    placeholder="Décrivez précisément vos besoins : types de produits, couleurs, matériaux souhaités, usage prévu..."
                    required
                    value={formData.details}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                    {loading ? 'Envoi en cours...' : 'Envoyer ma demande'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="section">
        <div className="container">
          <div className="section-title">
            <h2>Comment ça marche ?</h2>
            <p>Un processus simple et rapide pour vos demandes de devis et commandes.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>1</span>
              </div>
              <h3>Remplissez le formulaire</h3>
              <p>Décrivez vos besoins en détail pour que nous puissions vous proposer la meilleure solution.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>2</span>
              </div>
              <h3>Recevez votre devis</h3>
              <p>Notre équipe vous envoie un devis détaillé sous 24-48h avec les meilleures options.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>3</span>
              </div>
              <h3>Validation & Production</h3>
              <p>Après votre validation, nous lançons la production de votre commande.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>4</span>
              </div>
              <h3>Livraison</h3>
              <p>Vos produits sont livrés à l&apos;adresse de votre choix dans les délais convenus.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="section section-bg">
        <div className="container">
          <div className="about-content" style={{ gridTemplateColumns: '1fr 1fr 1fr', display: 'grid', gap: '2rem' }}>
            <div className="contact-item" style={{ textAlign: 'center', flexDirection: 'column', alignItems: 'center', display: 'flex' }}>
              <div className="contact-icon" style={{ marginBottom: 'var(--spacing-md)' }}>
                <i className="fas fa-phone"></i>
              </div>
              <h4>Par téléphone</h4>
              <p>Fixe: 36 110 027 | Mobile: 25 500 780<br />Lun-Ven : 8h-17h</p>
            </div>

            <div className="contact-item" style={{ textAlign: 'center', flexDirection: 'column', alignItems: 'center', display: 'flex' }}>
              <div className="contact-icon" style={{ marginBottom: 'var(--spacing-md)' }}>
                <i className="fas fa-envelope"></i>
              </div>
              <h4>Par e-mail</h4>
              <p>Societe@primavet.tn<br />Réponse sous 24h</p>
            </div>

            <div className="contact-item" style={{ textAlign: 'center', flexDirection: 'column', alignItems: 'center', display: 'flex' }}>
              <div className="contact-icon" style={{ marginBottom: 'var(--spacing-md)' }}>
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <h4>En showroom</h4>
              <p>Rue Saad Ibn Waqas<br />Kalâa Seghira (4021), Tunisie</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
