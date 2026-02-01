# Primavet - Site Web Prêt à Porter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code Quality](https://img.shields.io/badge/code%20quality-optimized-brightgreen)](.)

Site web professionnel pour **Primavet**, entreprise spécialisée dans la conception, le développement et la commercialisation de produits prêt à porter de qualité.

## 📋 Description

Ce projet est un site web vitrine moderne et responsive pour une entreprise du secteur prêt à porter. Il comprend toutes les fonctionnalités nécessaires pour présenter l'entreprise, ses produits, et faciliter la prise de contact avec les clients et partenaires.

### Backend & Database
- **Supabase** (PostgreSQL) - Backend as a Service
- **Row Level Security (RLS)** - Sécurité au niveau des données
- **Admin Dashboard** - Gestion complète du contenu
- **Analytics** - Tracking des visiteurs et statistiques

## 🎨 Caractéristiques

- **Design moderne** avec thème bleu dominant (Denim color palette)
- **Responsive** (Mobile-first approach)
- **SEO optimisé** avec balises meta appropriées
- **Navigation fluide** et intuitive
- **Formulaires interactifs** avec validation côté client et serveur
- **Animations** et effets visuels élégants
- **Content restriction** - Système de gestion des accès
- **Admin dashboard** - Interface d'administration complète

## 📁 Structure du Projet

```
/
├── index.html              # Page d'accueil
├── about.html              # Page À propos
├── products.html           # Catalogue produits
├── collections.html        # Collections avec filtres
├── showroom.html           # Galerie showroom
├── news.html               # Actualités/Blog
├── contact.html            # Contact
├── recruitment.html        # Recrutement
├── quote.html              # Demande de devis
├── suggestion.html         # Boîte à suggestions
├── login.html              # Connexion admin
├── auth.html               # Authentification
├── espace_admin.html       # Dashboard admin
│
├── css/
│   ├── styles.css          # Styles principaux
│   ├── admin.css           # Styles admin
│   ├── collections.css     # Styles collections
│   └── restricted-content.css
│
├── js/
│   ├── main.js             # Fonctionnalités principales
│   ├── supabase-client.js  # Configuration Supabase
│   ├── data-service.js     # Service de données (CRUD)
│   ├── admin.js            # Logique admin
│   ├── form-handler.js     # Gestion formulaires
│   ├── page-renderers.js   # Rendu dynamique
│   ├── collections-page.js # Filtres collections
│   └── visitor-tracker.js  # Analytics
│
├── database/
│   ├── README.md           # Documentation BDD
│   ├── schema.sql          # Schéma principal
│   └── [autres schemas]    # Fonctionnalités optionnelles
│
├── assets/                 # Images et médias
├── .gitignore              # Fichiers ignorés par Git
├── package.json            # Dépendances et scripts
├── wrangler.jsonc          # Config Cloudflare Pages
│
└── Documentation:
    ├── README.md           # Ce fichier
    ├── DOCUMENTATION.md    # Documentation technique
    ├── CONTRIBUTING.md     # Guide de contribution
    ├── SECURITY.md         # Sécurité et bonnes pratiques
    └── PERFORMANCE.md      # Guide d'optimisation
```

## 📄 Pages

### Page d'Accueil (index.html)
- Slider/Banner dynamique
- Présentation synthétique de Primavet
- Produits phares et nouveautés
- Accès rapides vers les sections principales

### Page À Propos (about.html)
- Historique de l'entreprise
- Mission, vision et valeurs
- Présentation de l'équipe
- Statistiques clés

### Page Produits (products.html)
- Catalogue structuré avec filtres par catégorie
- Organisation : Homme / Femme / Professionnel / Accessoires
- Boutons "Demander un devis" et "Commander"

### Page Showroom (showroom.html)
- Galerie de collections et réalisations
- Organisation par catégories
- Zoom sur les images

### Page Actualités (news.html)
- Articles et nouveautés
- Classement par catégories
- Sidebar avec catégories et articles récents

### Page Contact (contact.html)
- Carte Google Maps intégrée
- Formulaire de contact complet
- Informations pratiques (adresse, téléphone, e-mail, horaires)

### Page Recrutement (recruitment.html)
- Liste des postes ouverts
- Formulaire de candidature avec upload CV (PDF)

### Page Devis (quote.html)
- Formulaire de demande de devis détaillé
- Option de commande simple
- Message de confirmation automatique

## 🛠️ Technologies Utilisées

### Frontend
- **HTML5** - Structure sémantique
- **CSS3** - Styles avec variables CSS, Flexbox/Grid
- **JavaScript** (Vanilla ES6+) - Interactivité
- **Google Fonts** - Inter, Playfair Display
- **Font Awesome** - Icônes

### Backend
- **Supabase** - Backend as a Service
- **PostgreSQL** - Base de données
- **Row Level Security** - Sécurité des données

### Deployment
- **Cloudflare Pages** - Hébergement et CDN
- **Wrangler** - Outil de déploiement

### Development Tools
- **ESLint** - Linting JavaScript
- **Prettier** - Formatage de code
- **Live Server** - Serveur de développement

## 🚀 Installation

### Prérequis
- Node.js 14.0.0 ou supérieur
- Compte Supabase (pour les fonctionnalités backend)

### Installation Rapide

1. **Clonez le repository:**
   ```bash
   git clone https://github.com/Tarekazabou/tarekyahya.git
   cd tarekyahya
   ```

2. **Installez les dépendances:**
   ```bash
   npm install
   ```

3. **Configurez Supabase:**
   - Créez un projet sur [supabase.com](https://supabase.com)
   - Exécutez `database/schema.sql` dans l'éditeur SQL de Supabase
   - Mettez à jour `js/supabase-client.js` avec vos credentials

4. **Lancez le serveur de développement:**
   ```bash
   npm run dev
   ```
   Le site s'ouvrira à `http://localhost:8080`

### Installation Simple (Sans build tools)

Si vous ne voulez pas utiliser npm:
1. Clonez le repository
2. Ouvrez `index.html` dans votre navigateur
3. Les fonctionnalités backend nécessiteront Supabase configuré

## 🎯 Fonctionnalités

- ✅ Navigation responsive avec menu mobile
- ✅ Slider héro avec transitions automatiques
- ✅ Filtrage des produits par catégorie
- ✅ Validation des formulaires côté client
- ✅ Galerie d'images avec modal zoom
- ✅ Upload de fichiers (CV PDF)
- ✅ Animations au scroll
- ✅ Intégration Google Maps
- ✅ Liens réseaux sociaux

## 📱 Responsive Design

Le site s'adapte à toutes les tailles d'écran :
- Desktop (> 1024px)
- Tablette (768px - 1024px)
- Mobile (< 768px)

## 🔒 Sécurité

- ✅ Row Level Security (RLS) sur toutes les tables
- ✅ Validation des formulaires côté client et serveur
- ✅ Protection CSRF avec tokens
- ✅ HTTPS automatique via Cloudflare
- ✅ Sanitization des entrées utilisateur
- ✅ Gestion sécurisée des sessions
- ✅ Logs d'audit pour les actions admin

Voir [SECURITY.md](./SECURITY.md) pour plus de détails.

## 📊 Performance

- 🚀 Optimisations appliquées
- 🎯 Code propre sans console.log en production
- 📦 Assets optimisés
- ⚡ Chargement rapide via CDN Cloudflare

Voir [PERFORMANCE.md](./PERFORMANCE.md) pour le guide complet d'optimisation.

## 🤝 Contribution

Les contributions sont les bienvenues! Consultez [CONTRIBUTING.md](./CONTRIBUTING.md) pour:
- Instructions de setup
- Standards de code
- Workflow Git
- Guidelines de contribution

## 📚 Documentation

- **[README.md](./README.md)** - Vue d'ensemble (ce fichier)
- **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Documentation technique détaillée
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Guide de contribution
- **[SECURITY.md](./SECURITY.md)** - Sécurité et bonnes pratiques
- **[PERFORMANCE.md](./PERFORMANCE.md)** - Guide d'optimisation des performances
- **[database/README.md](./database/README.md)** - Documentation base de données

## 📜 Scripts NPM

```bash
npm run dev           # Démarrer serveur de développement
npm run lint          # Vérifier le code JavaScript
npm run lint:fix      # Corriger automatiquement les erreurs
npm run format        # Formater tout le code
npm run format:check  # Vérifier le formatage
npm run validate      # Linter + vérifier formatage
npm run deploy        # Déployer sur Cloudflare Pages
```

## 🐛 Bugs & Issues

Si vous trouvez un bug ou avez une suggestion:
1. Vérifiez d'abord les [issues existants](https://github.com/Tarekazabou/tarekyahya/issues)
2. Créez un nouvel issue avec une description détaillée
3. Pour les vulnérabilités de sécurité, contactez en privé

## 📞 Contact

**Primavet**
- 📍 Adresse : 123 Avenue du Prêt à Porter, 75001 Paris, France
- 📞 Téléphone : +33 1 23 45 67 89
- 📧 E-mail : contact@primavet.com
- 🌐 Website : [primavet.com](https://primavet.com)

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 🙏 Remerciements

- [Supabase](https://supabase.com) pour le backend
- [Cloudflare Pages](https://pages.cloudflare.com) pour l'hébergement
- [Font Awesome](https://fontawesome.com) pour les icônes
- [Google Fonts](https://fonts.google.com) pour les polices

---

**Fait avec ❤️ par l'équipe Primavet**

© 2024 Primavet. Tous droits réservés.