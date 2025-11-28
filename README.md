# LRPP - Apprentissage des Procès-Verbaux

Application web d'entraînement à la procédure pénale pour la préparation OPJ. Permet de mémoriser les procès-verbaux et cadres d'enquête du Guide ultime de l'OPJ par répétition active.

## Fonctionnalités

### Modes d'apprentissage

- **Mode Cours** : Lecture structurée des PV avec navigation par sections
  - Interface unifiée avec sélection rapide de PV
  - Bouton aléatoire pour découverte
  - Accès direct au mode révision
- **Mode Révision** : Entraînement interactif avec évaluation en temps réel
  - Remplissage de zones à compléter
  - Notation automatique avec correction détaillée
  - Indicateurs de score par section et globaux
- **Support utilisateur** : Système de bug report intégré aux pages de cours et révision

### Système d'accès

| Niveau | Accès | Limite |
|--------|-------|--------|
| Anonyme | Sans inscription | 1 PV |
| Gratuit | Compte créé | 6 PVs |
| Premium | Abonnement ou code promo | Illimité |

### Administration

- Gestion des PV et contenus pédagogiques
- Gestion des codes promo (beta, demo, licence)
- Suivi des tickets support

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 15 (App Router) + Tailwind CSS + Design System cohérent |
| Backend | NestJS + TypeORM |
| Base de données | SQLite (dev) / PostgreSQL (prod) |
| Authentification | Supabase Auth |
| Paiement | Lemon Squeezy |
| Déploiement | Docker + Traefik sur VPS |

### Design System

L'application utilise un système de design cohérent basé sur Tailwind CSS avec :
- Classes de composants réutilisables (`.btn`, `.card`, `.badge`, `.input`, `.select`)
- Support du dark mode automatique
- États hover/focus uniformes
- Design responsive mobile-first

## Structure du projet

```
LRPP/
├── apps/
│   ├── lrpp-api/          # API NestJS (port 3001)
│   └── lrpp-web/          # Frontend Next.js (port 3000)
├── data/
│   └── pvs/               # Données PV au format JSON
├── docs/
│   ├── SPEC.md            # Spécifications fonctionnelles
│   ├── CONSIGNE.md        # Consignes internes
│   └── DEPLOIEMENT_VPS.md # Guide de déploiement
└── docker-compose*.yml    # Configurations Docker
```

## Installation

### Prérequis

- Node.js >= 20
- pnpm >= 9

### Développement

```bash
# Cloner le dépôt
git clone https://github.com/ybdn/LRPP.git
cd LRPP

# Installer les dépendances
pnpm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs Supabase

# Lancer l'application
pnpm dev                    # API + Web en parallèle
pnpm dev:api                # API seule (http://localhost:3001)
pnpm dev:web                # Web seul (http://localhost:3000)
```

### Base de données

```bash
# SQLite par défaut (aucune configuration)
pnpm dev

# PostgreSQL (optionnel)
docker compose up postgres -d
DATABASE_CLIENT=postgres pnpm dev

# Réinitialiser les données
pnpm --filter lrpp-api seed
```

## Variables d'environnement

Voir `.env.example` pour le développement et `.env.production.example` pour la production.

### Variables principales

```env
# Base de données
DATABASE_CLIENT=sqlite              # ou postgres
SQLITE_PATH=lrpp-dev.sqlite

# API
API_PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001

# Supabase (authentification)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Lemon Squeezy (paiement)
LEMONSQUEEZY_WEBHOOK_SECRET=xxx
LEMONSQUEEZY_CHECKOUT_URL=https://xxx.lemonsqueezy.com/buy/xxx
```

## Codes promo

L'administration (`/admin/promo-codes`) permet de générer des codes d'accès temporaires :

| Type | Durée par défaut | Usage |
|------|------------------|-------|
| Beta | 30 jours | Beta-testeurs |
| Demo | 7 jours | Démonstration |
| License | 365 jours | Licences gratuites |

## Déploiement

Le déploiement se fait automatiquement via GitHub Actions vers le VPS.

URL production : https://lrpp.ybdn.fr

Voir `docs/DEPLOIEMENT_VPS.md` pour les détails.

## Build

```bash
pnpm build                  # Build API + Web
pnpm lint                   # Vérification ESLint
```

## Documentation

- [Spécifications fonctionnelles](docs/SPEC.md)
- [Consignes internes](docs/CONSIGNE.md)
- [Guide de déploiement VPS](docs/DEPLOIEMENT_VPS.md)

## Contenu pédagogique

### Cadres d'enquête (7)

| Code | Nom | Articles CPP |
|------|-----|--------------|
| EP | Enquête préliminaire | 75 à 78 |
| EF | Enquête de flagrance | 53 à 67 |
| CR | Commission rogatoire | 151 à 154-2 |
| DC | Découverte de cadavre | 74 |
| DPGB | Découverte personne grièvement blessée | 74 |
| DI | Disparition inquiétante | 74-1 |
| RPF | Recherche personne en fuite | 74-2 |

### Procès-verbaux (25+)

GAV, perquisition, saisie, auditions, réquisitions, mandats, etc.

Chaque PV est structuré en sections : cadre légal, motivation, notification des droits, déroulement, éléments de fond.

## Licence

Projet privé - Ne pas redistribuer les contenus pédagogiques sans accord écrit.
