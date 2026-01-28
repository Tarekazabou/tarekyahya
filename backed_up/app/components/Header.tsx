'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/about', label: 'À propos' },
  { href: '/products', label: 'Collections' },
  { href: '/showroom', label: 'Outfit' },
  { href: '/news', label: 'Actualités' },
  { href: '/recruitment', label: 'Recrutement' },
  { href: '/suggestion', label: 'Suggestion' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <Link href="/" className="logo">
          <Image
            src="/logo1-removebg-preview.png"
            alt="Primavet"
            className="logo-img"
            width={120}
            height={40}
            priority
          />
        </Link>

        <nav className="nav">
          <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`} id="nav-menu" role="navigation" aria-label="Navigation principale">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={pathname === link.href ? 'active' : ''}
                  aria-current={pathname === link.href ? 'page' : undefined}
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/quote" className="btn btn-primary nav-cta">
            Demander un devis
          </Link>
          <div
            className={`nav-toggle ${isMenuOpen ? 'active' : ''}`}
            role="button"
            aria-label="Menu de navigation"
            aria-expanded={isMenuOpen}
            aria-controls="nav-menu"
            tabIndex={0}
            onClick={toggleMenu}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMenu();
              }
            }}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </nav>
      </div>
    </header>
  );
}
