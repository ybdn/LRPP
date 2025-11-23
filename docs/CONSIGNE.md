# Consigne interne – dépôt LRPP

Document de référence pour toute personne qui intervient sur le dépôt `lrpp`. Garder ce fichier à jour en cas de modification du workflow ou de l’infrastructure.

## 1. Périmètre & objectifs

- LRPP est une web app d’entraînement à la procédure pénale : frontend Next.js (`apps/lrpp-web`), backend NestJS (`apps/lrpp-api`), données pédagogiques dans `data/`.
- Les branches `main` et `production` doivent rester déployables. Toute évolution passe par une branche de fonctionnalité + PR.
- Les spécifications fonctionnelles détaillées sont dans `docs/SPEC.md`. Aucune feature ne part en dev sans validation dans ce document.

## 2. Préparation de l’environnement

1. Node.js >= 20, pnpm >= 9 (voir `package.json`).
2. `pnpm install` à la racine (utilise le monorepo pnpm).
3. Copier `.env.example` → `.env` (dev) et renseigner au minimum `DATABASE_CLIENT`, `SQLITE_PATH`, `API_PORT`, `NEXT_PUBLIC_API_URL`. Pour la prod voir `.env.production.example`.
4. Données : les JSON du dossier `data/pv` sont chargés automatiquement au démarrage de l’API. Les modifications doivent être versionnées et relues comme du code.

## 3. Commandes utiles

- `pnpm dev` : lance API (port 3001) + Web (port 3000) en mode watch.  
  - `pnpm dev:api` / `pnpm dev:web` pour cibler un seul service.
- `pnpm build`, `pnpm lint`, `pnpm test` : à exécuter avant toute PR.
- BDD : SQLite par défaut. Pour PostgreSQL local : `docker compose up postgres -d` puis `DATABASE_CLIENT=postgres pnpm dev`.
- Migrations TypeORM : `pnpm --filter lrpp-api migration:generate` puis `migration:run`. Toujours contrôler le diff SQL.

## 4. Qualité & conventions

- TypeScript strict, eslint + prettier déjà configurés (ne pas désactiver les règles sans discussion).
- Tests unitaires et e2e sont attendus sur l’API (Nest) et sur les hooks React sensibles. Ajouter des tests lorsqu’un bug est corrigé.
- Pas de secrets en clair. Utiliser `.env` et GitHub Actions secrets.
- Les données pédagogiques représentent la source métier : chaque ajout doit être référencé (cadre légal, PV concerné) et testé dans l’app via les seeders.

## 5. Déploiement & infra

- Déploiement de référence documenté dans `docs/DEPLOIEMENT_VPS.md`.
- Deux modes au choix :
  1. `docker-compose.prod.yml` : stack autonome (Postgres + API + Web + Nginx). L’hôte expose 80/443 via `nginx/nginx.conf` (penser à renseigner `server_name` pour `lrpp.ybdn.fr` + IP).
  2. `docker-compose.traefik.yml` : le frontend et l’API sont publiés derrière Traefik via le réseau `proxy` (cf. VPS `/home/ybdn/infra/traefik`). Créer le réseau partagé `docker network create proxy` si absent.
- Toujours reconstruire les images après une mise à jour de dépendances (`docker compose build --no-cache`).
- Sauvegardes Postgres : volume `postgres_data`. Export hebdo avec `pg_dump` recommandé (`scripts/` contiendra les helpers si besoin).

## 6. Opérations

- Monitoring rapide : `docker compose logs -f <service>` ou `pnpm --filter lrpp-api start:debug`.
- En cas d’erreur 404 sur `lrpp.ybdn.fr`, vérifier en priorité que le reverse-proxy correspondant (Nginx standalone ou label Traefik) pointe bien vers les conteneurs `web`/`api` et que le DNS résout vers 137.74.41.101.
- Pour toute évolution infra (Traefik, SSL, sauvegardes), mettre à jour `docs/DEPLOIEMENT_VPS.md` et la présente consigne.

## 7. Checklist avant merge

- [ ] Spécification validée / ticket référencé.
- [ ] Lint + tests locaux OK.
- [ ] Migration BDD testée (up/down) et documentée.
- [ ] Données `data/` mises à jour si besoin.
- [ ] Docs pertinentes mises à jour (`README`, `docs/`, consigne).

> Rappel : ce dépôt est privé et destiné à la préparation OPJ. Ne pas redistribuer les contenus pédagogiques sans accord écrit.
