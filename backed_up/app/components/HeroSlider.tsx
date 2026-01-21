'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Slide {
  titleParts: string[];
  description: string;
  primaryButton: { text: string; href: string };
  secondaryButton: { text: string; href: string };
}

const slides: Slide[] = [
  {
    titleParts: ['Excellence Prêt à Porter', 'depuis des Années'],
    description:
      "Primavet, votre partenaire de confiance pour des produits prêt à porter de qualité supérieure. Innovation, savoir-faire et engagement envers l'excellence.",
    primaryButton: { text: 'Découvrir nos produits', href: '/products' },
    secondaryButton: { text: 'Demander un devis', href: '/quote' },
  },
  {
    titleParts: ['Collections Innovantes', 'et Tendances'],
    description:
      'Découvrez nos nouvelles collections alliant style moderne et confort optimal. Des créations uniques pour tous vos besoins.',
    primaryButton: { text: 'Visiter le showroom', href: '/showroom' },
    secondaryButton: { text: 'Nous contacter', href: '/contact' },
  },
  {
    titleParts: ['Service Professionnel', 'et Personnalisé'],
    description:
      'Un accompagnement sur mesure pour vos projets prêt à porter. De la conception à la livraison, nous sommes à vos côtés.',
    primaryButton: { text: 'En savoir plus', href: '/about' },
    secondaryButton: { text: 'Commander maintenant', href: '/quote' },
  },
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-slider">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`slide ${index === currentSlide ? 'active' : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} sur ${slides.length}`}
              aria-hidden={index !== currentSlide}
            >
              <div className="hero-content">
                <h1>
                  {slide.titleParts.map((part, i) => (
                    <span key={i}>
                      {part}
                      {i < slide.titleParts.length - 1 && <br />}
                    </span>
                  ))}
                </h1>
                <p>{slide.description}</p>
                <div className="hero-buttons">
                  <Link href={slide.primaryButton.href} className="btn btn-white btn-lg">
                    {slide.primaryButton.text}
                  </Link>
                  <Link
                    href={slide.secondaryButton.href}
                    className="btn btn-secondary btn-lg"
                    style={{ borderColor: 'white', color: 'white' }}
                  >
                    {slide.secondaryButton.text}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="slider-dots">
          {slides.map((_, index) => (
            <span
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              role="button"
              aria-label={`Slide ${index + 1}`}
              aria-selected={index === currentSlide}
              tabIndex={0}
              onClick={() => setCurrentSlide(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setCurrentSlide(index);
                }
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
