'use client';

import { useState } from 'react';
import PageHeader from '../components/PageHeader';

export default function SuggestionPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate form submission
    setTimeout(() => {
      setSuccess(true);
      setFormData({ name: '', email: '', message: '' });
      setLoading(false);
    }, 1000);
  };

  return (
    <>
      <PageHeader title="Coin Suggestion" breadcrumb="Suggestion" />

      {/* Suggestion Section */}
      <section className="section">
        <div className="container">
          <div className="contact-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
            <div className="contact-form">
              <h3 style={{ color: 'var(--primary-color)', marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
                Proposez votre Outfit
              </h3>
              <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--gray)' }}>
                Vous avez une idée de tenue ou un style que vous aimeriez voir chez Primavet ?
                Envoyez-nous une photo et vos suggestions !
              </p>

              {success && (
                <div style={{ background: '#22c55e', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
                  <strong>✓ Votre suggestion a été envoyée avec succès ! Merci pour votre contribution.</strong>
                </div>
              )}

              {error && (
                <div style={{ background: '#ef4444', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
                  <strong>{error}</strong>
                </div>
              )}

              <form onSubmit={handleSubmit} id="suggestionForm">
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

                <div className="form-group">
                  <label>Photo de l&apos;outfit (Image uniquement) *</label>
                  <div
                    className="file-upload"
                    style={{
                      border: '2px dashed #cbd5e1',
                      padding: '2rem',
                      textAlign: 'center',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <input
                      type="file"
                      id="outfit-image"
                      name="outfit-image"
                      accept="image/*"
                      required
                      style={{ display: 'none' }}
                    />
                    <i className="fas fa-camera" style={{ fontSize: '2rem', color: 'var(--primary-color)', marginBottom: '1rem' }}></i>
                    <p style={{ margin: 0, color: 'var(--gray)' }}>
                      Cliquez ou déposez votre photo ici (JPG, PNG)
                    </p>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Description / Suggestion *</label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Décrivez votre suggestion..."
                    required
                    style={{ minHeight: '150px' }}
                    value={formData.message}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                    {loading ? 'Envoi en cours...' : 'Envoyer ma suggestion'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
