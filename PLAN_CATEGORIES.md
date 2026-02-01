# 📋 Plan d'Implémentation - Système de Catégories & Filtres Facettes

## Vue d'ensemble

Ce document décrit l'implémentation d'un système de navigation par catégories et filtres facettes (style Jack & Jones) pour la page Collections de Primavet.

---

## 📁 Fichiers Créés/Modifiés

### Nouveaux Fichiers

| Fichier | Description |
|---------|-------------|
| `database/categories_schema.sql` | Schéma SQL complet pour les catégories, attributs et filtres |
| `collections.html` | Nouvelle page Collections avec sidebar filtres |
| `css/collections.css` | Styles CSS pour la page Collections |
| `js/collections-page.js` | Logique JavaScript pour les filtres et affichage |

### Fichiers Modifiés

| Fichier | Modifications |
|---------|--------------|
| `js/data-service.js` | Nouvelles méthodes: `getCategoriesTree()`, `getProductsFaceted()`, `getAttributes()` |

---

## 🗄️ 1. Backend (Supabase) - Modifications

### Nouvelles Tables

```
categories              → Catégories hiérarchiques (parent_id pour arborescence)
product_categories      → Liaison produit ↔ catégories (many-to-many)
attributes             → Définition des attributs filtrables (couleur, taille, etc.)
attribute_values       → Valeurs possibles pour chaque attribut
product_attribute_values → Liaison produit ↔ valeurs d'attributs
```

### Colonnes Ajoutées à `products`

```sql
price               DECIMAL(10,2)    -- Prix du produit
price_original      DECIMAL(10,2)    -- Prix original (pour promos)
brand               VARCHAR(100)      -- Marque
color               VARCHAR(50)       -- Couleur principale
gender              VARCHAR(20)       -- homme, femme, mixte, enfant
is_new              BOOLEAN           -- Produit nouveau
is_on_sale          BOOLEAN           -- En promotion
stock_status        VARCHAR(20)       -- Statut stock
```

### Fonctions RPC

| Fonction | Description |
|----------|-------------|
| `get_products_faceted(...)` | Recherche facettée avec compteurs |
| `get_categories_tree()` | Arborescence des catégories |

---

## 🎨 2. Frontend - Nouvelle Interface

### Structure de la Page

```
┌─────────────────────────────────────────────────────────────┐
│                        HEADER                                │
├─────────────────────────────────────────────────────────────┤
│                     PAGE HEADER                              │
│                    "Collections"                             │
├──────────────────┬──────────────────────────────────────────┤
│                  │            TOOLBAR                        │
│                  │  [Results] [Quick Filters] [Search] [Sort]│
│    SIDEBAR       ├──────────────────────────────────────────┤
│   FILTRES        │                                          │
│                  │          PRODUCTS GRID                    │
│  ▼ Catégories    │                                          │
│  ▼ Genre         │    ┌────┐  ┌────┐  ┌────┐               │
│  ▼ Prix          │    │Prod│  │Prod│  │Prod│               │
│  ▼ Couleur       │    └────┘  └────┘  └────┘               │
│  ▼ Marque        │                                          │
│  ▼ Spécial       │    ┌────┐  ┌────┐  ┌────┐               │
│                  │    │Prod│  │Prod│  │Prod│               │
│                  │    └────┘  └────┘  └────┘               │
│                  ├──────────────────────────────────────────┤
│                  │           PAGINATION                      │
└──────────────────┴──────────────────────────────────────────┘
```

### Fonctionnalités

- ✅ Sidebar avec filtres collapsibles
- ✅ Catégories hiérarchiques (arborescence)
- ✅ Filtres facettes avec compteurs
- ✅ Filtres rapides (pills)
- ✅ Recherche avec auto-complete
- ✅ Tri multiple (prix, date, nom, etc.)
- ✅ Vue grille/liste
- ✅ Tags des filtres actifs
- ✅ Synchronisation URL (bookmarkable)
- ✅ Responsive (sidebar drawer mobile)
- ✅ Modal détail produit

---

## 🔧 3. Migration - Étapes

### Étape 1: Exécuter le Schema SQL

```bash
# Dans Supabase SQL Editor, exécuter:
database/categories_schema.sql
```

Ceci va:
- Créer les nouvelles tables
- Ajouter les colonnes à `products`
- Créer les index pour performance
- Configurer les politiques RLS
- Créer les fonctions RPC
- Insérer les données de démo (catégories, attributs)

### Étape 2: Migrer les Données Existantes

Le script inclut une migration automatique:
```sql
-- Lie les produits existants aux catégories basées sur le champ 'category'
INSERT INTO product_categories (product_id, category_id, is_primary)
SELECT p.id, c.id, true
FROM products p
JOIN categories c ON (
    (p.category = 'homme' AND c.slug = 'vetements') OR
    (p.category = 'femme' AND c.slug = 'vetements') ...
)
```

### Étape 3: Mettre à Jour les Produits (Optionnel)

Pour enrichir les produits avec les nouvelles colonnes:
```sql
UPDATE products SET
    price = 49.99,
    brand = 'Primavet',
    gender = 'homme',
    is_new = true
WHERE id = 1;
```

### Étape 4: Tester

1. Ouvrir `collections.html` dans le navigateur
2. Vérifier le chargement des catégories
3. Tester les filtres
4. Vérifier la pagination
5. Tester sur mobile

---

## 📊 4. Structure des Données

### Catégories (Exemple)

```
Vêtements (id=1)
├── T-shirts (id=4, parent_id=1)
├── Chemises (id=5, parent_id=1)
├── Pantalons (id=6, parent_id=1)
├── Jeans (id=7, parent_id=1)
└── Vestes (id=8, parent_id=1)

Accessoires (id=2)
├── Ceintures (id=10, parent_id=2)
├── Écharpes (id=11, parent_id=2)
└── Chapeaux (id=12, parent_id=2)

Professionnel (id=3)
├── Uniformes (id=13, parent_id=3)
└── Vêtements de travail (id=14, parent_id=3)
```

### Attributs (Exemple)

```
Couleur (display_type: color)
├── Noir (#000000)
├── Blanc (#FFFFFF)
├── Bleu (#1e3a8a)
└── ...

Taille (display_type: size)
├── XS
├── S
├── M
├── L
├── XL
└── XXL

Matière (display_type: checkbox)
├── Coton
├── Polyester
├── Lin
└── ...
```

---

## 🔌 5. API - Endpoints

### `getProductsFaceted(filters)`

**Paramètres:**
```javascript
{
    categoryIds: [1, 4],      // IDs des catégories
    gender: 'homme',          // Genre
    brands: ['Primavet'],     // Marques
    colors: ['noir', 'bleu'], // Couleurs
    priceMin: 20,             // Prix minimum
    priceMax: 100,            // Prix maximum
    isNew: true,              // Nouveautés uniquement
    isOnSale: false,          // Promos uniquement
    searchTerm: 'jean',       // Recherche texte
    sortBy: 'newest',         // Tri (newest, price_asc, price_desc, name, featured)
    page: 1,                  // Page
    perPage: 12               // Produits par page
}
```

**Réponse:**
```javascript
{
    data: [...],           // Produits
    count: 42,             // Total
    totalPages: 4,         // Pages
    currentPage: 1,
    perPage: 12,
    facets: {
        categories: [...], // Compteurs par catégorie
        genders: [...],    // Compteurs par genre
        brands: [...],     // Compteurs par marque
        colors: [...],     // Compteurs par couleur
        price_range: { min: 10, max: 200 }
    }
}
```

---

## 🎯 6. URL Parameters

Les filtres sont synchronisés avec l'URL pour permettre le partage/bookmark:

```
/collections.html?cat=1,4&gender=homme&colors=noir,bleu&min=20&max=100&sort=price_asc&page=2&q=jean
```

| Param | Description |
|-------|-------------|
| `cat` | IDs catégories (séparés par virgule) |
| `gender` | Genre (homme, femme, mixte) |
| `brands` | Marques |
| `colors` | Couleurs |
| `min` | Prix minimum |
| `max` | Prix maximum |
| `new` | Nouveautés (true) |
| `sale` | Promos (true) |
| `sort` | Tri |
| `page` | Page |
| `q` | Recherche |

---

## 📱 7. Responsive Design

### Desktop (>992px)
- Sidebar fixe à gauche (280px)
- Grille 3 colonnes

### Tablet (768-992px)
- Sidebar en drawer (slide-in)
- Grille 2 colonnes
- Bouton flottant "Filtres"

### Mobile (<768px)
- Sidebar fullscreen drawer
- Grille 1 colonne
- Quick filters masqués
- Bouton "Voir résultats" dans sidebar

---

## 🔄 8. Maintenance

### Ajouter une Nouvelle Catégorie

```sql
INSERT INTO categories (name, slug, icon, parent_id, sort_order)
VALUES ('Sweats', 'sweats', 'fa-tshirt', 1, 7);
```

### Ajouter un Nouvel Attribut

```sql
-- Attribut
INSERT INTO attributes (name, slug, display_type, sort_order)
VALUES ('Longueur', 'longueur', 'checkbox', 5);

-- Valeurs
INSERT INTO attribute_values (attribute_id, value, slug, sort_order)
SELECT id, 'Court', 'court', 1 FROM attributes WHERE slug = 'longueur'
UNION ALL
SELECT id, 'Standard', 'standard', 2 FROM attributes WHERE slug = 'longueur'
UNION ALL
SELECT id, 'Long', 'long', 3 FROM attributes WHERE slug = 'longueur';
```

### Lier un Produit à une Catégorie

```sql
INSERT INTO product_categories (product_id, category_id, is_primary)
VALUES (1, 4, true);  -- Produit 1 → T-shirts (primaire)

INSERT INTO product_categories (product_id, category_id, is_primary)
VALUES (1, 1, false); -- Produit 1 → Vêtements (parent)
```

---

## 📝 Notes Importantes

1. **Fallback**: Si la RPC `get_products_faceted` échoue, le système utilise automatiquement des requêtes classiques
2. **Cache**: Le DataService met en cache les catégories et attributs (5 minutes)
3. **Performance**: Les index SQL optimisent les requêtes de filtrage
4. **Sécurité**: Les politiques RLS protègent les données admin

---

## 🚀 Prochaines Étapes

1. [ ] Tester en production
2. [ ] Ajouter les vraies données produits
3. [ ] Implémenter les favoris (localStorage ou Supabase)
4. [ ] Ajouter les variantes produit (tailles/couleurs)
5. [ ] Intégrer avec le panier/devis
6. [ ] Ajouter des filtres supplémentaires si nécessaire
