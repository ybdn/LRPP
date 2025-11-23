# Guide de Déploiement LRPP sur VPS avec Traefik

## Informations serveur

- **IP** : 137.74.41.101
- **User** : ybdn
- **OS recommandé** : Ubuntu 22.04 / Debian 12

---

## 1. Prérequis sur le VPS

### 1.1 Connexion SSH

```bash
ssh ybdn@137.74.41.101
```

### 1.2 Mise à jour du système

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Installation de Docker

```bash
# Installation de Docker
curl -fsSL https://get.docker.com | sh

# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker ybdn

# Se déconnecter et reconnecter pour appliquer les permissions
exit
# Puis reconnexion SSH
```

### 1.4 Installation de Git

```bash
sudo apt install -y git
```

---

## 2. Installation de LRPP

### 2.1 Cloner le dépôt

```bash
# Créer le dossier de déploiement
mkdir -p ~/lrpp
cd ~/lrpp

# Cloner le dépôt
git clone https://github.com/ybdn/LRPP.git .
```

### 2.2 Configurer les variables d'environnement

```bash
# Copier le fichier d'exemple
cp .env.production.example .env

# Éditer le fichier
nano .env
```

Contenu du fichier `.env` :

```env
# PostgreSQL
POSTGRES_USER=lrpp
POSTGRES_PASSWORD=MotDePasseTresSecurise123!
POSTGRES_DB=lrpp

# Sécurité
JWT_SECRET=une_chaine_aleatoire_de_64_caracteres_minimum_pour_securite

# API URL (avec votre domaine ou IP)
NEXT_PUBLIC_API_URL=http://137.74.41.101/api
```

---

## 3. Configuration de Traefik

### 3.1 Créer la structure Traefik

```bash
mkdir -p ~/traefik
cd ~/traefik
```

### 3.2 Créer le fichier docker-compose pour Traefik

```bash
nano docker-compose.yml
```

Contenu :

```yaml
services:
  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: unless-stopped
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      # Décommenter pour HTTPS avec Let's Encrypt
      # - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      # - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      # - "--certificatesresolvers.letsencrypt.acme.email=votre@email.com"
      # - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_letsencrypt:/letsencrypt
    networks:
      - traefik-public
    labels:
      - "traefik.enable=true"
      # Dashboard Traefik (optionnel)
      - "traefik.http.routers.dashboard.rule=Host(`traefik.137.74.41.101.nip.io`)"
      - "traefik.http.routers.dashboard.service=api@internal"
      - "traefik.http.routers.dashboard.middlewares=auth"
      - "traefik.http.middlewares.auth.basicauth.users=admin:$$apr1$$xyz$$hashedpassword"

volumes:
  traefik_letsencrypt:

networks:
  traefik-public:
    external: true
```

### 3.3 Créer le réseau Docker partagé

```bash
docker network create traefik-public
```

### 3.4 Démarrer Traefik

```bash
cd ~/traefik
docker compose up -d
```

---

## 4. Déployer LRPP avec Traefik

### 4.1 Créer le fichier docker-compose pour LRPP

Retourner dans le dossier LRPP :

```bash
cd ~/lrpp
```

Créer un fichier `docker-compose.traefik.yml` :

```bash
nano docker-compose.traefik.yml
```

Contenu :

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: lrpp-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-lrpp}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-lrpp}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-lrpp}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - lrpp-internal

  api:
    build:
      context: .
      dockerfile: apps/lrpp-api/Dockerfile
    container_name: lrpp-api
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_CLIENT: postgres
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USER: ${POSTGRES_USER:-lrpp}
      DATABASE_PASSWORD: ${POSTGRES_PASSWORD}
      DATABASE_NAME: ${POSTGRES_DB:-lrpp}
      API_PORT: 3001
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - lrpp-internal
      - traefik-public
    labels:
      - "traefik.enable=true"
      # Route API
      - "traefik.http.routers.lrpp-api.rule=Host(`137.74.41.101`) && PathPrefix(`/api`)"
      - "traefik.http.routers.lrpp-api.entrypoints=web"
      - "traefik.http.services.lrpp-api.loadbalancer.server.port=3001"
      # Strip /api prefix si nécessaire (décommenter si l'API n'attend pas /api)
      # - "traefik.http.middlewares.strip-api.stripprefix.prefixes=/api"
      # - "traefik.http.routers.lrpp-api.middlewares=strip-api"

  web:
    build:
      context: .
      dockerfile: apps/lrpp-web/Dockerfile
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://137.74.41.101/api}
    container_name: lrpp-web
    restart: unless-stopped
    environment:
      NODE_ENV: production
    depends_on:
      - api
    networks:
      - lrpp-internal
      - traefik-public
    labels:
      - "traefik.enable=true"
      # Route Web (frontend)
      - "traefik.http.routers.lrpp-web.rule=Host(`137.74.41.101`)"
      - "traefik.http.routers.lrpp-web.entrypoints=web"
      - "traefik.http.services.lrpp-web.loadbalancer.server.port=3000"
      # Priorité basse pour que /api passe en premier
      - "traefik.http.routers.lrpp-web.priority=1"

volumes:
  postgres_data:

networks:
  lrpp-internal:
    driver: bridge
  traefik-public:
    external: true
```

### 4.2 Mettre à jour le fichier .env

```bash
nano .env
```

Assurez-vous que `NEXT_PUBLIC_API_URL` pointe vers `/api` :

```env
NEXT_PUBLIC_API_URL=http://137.74.41.101/api
```

---

## 5. Lancer l'application

### 5.1 Build et démarrage

```bash
cd ~/lrpp

# Build des images
docker compose -f docker-compose.traefik.yml build

# Démarrage
docker compose -f docker-compose.traefik.yml up -d
```

### 5.2 Vérifier le statut

```bash
# Voir les conteneurs
docker compose -f docker-compose.traefik.yml ps

# Voir les logs
docker compose -f docker-compose.traefik.yml logs -f

# Logs d'un service spécifique
docker compose -f docker-compose.traefik.yml logs -f api
docker compose -f docker-compose.traefik.yml logs -f web
```

---

## 6. Commandes utiles

### Mise à jour de l'application

```bash
cd ~/lrpp
git pull origin main
docker compose -f docker-compose.traefik.yml down
docker compose -f docker-compose.traefik.yml build --no-cache
docker compose -f docker-compose.traefik.yml up -d
```

### Redémarrer les services

```bash
docker compose -f docker-compose.traefik.yml restart
```

### Voir les logs en temps réel

```bash
docker compose -f docker-compose.traefik.yml logs -f
```

### Nettoyer les images Docker inutilisées

```bash
docker image prune -f
docker system prune -f
```

### Accéder à la base de données

```bash
docker exec -it lrpp-postgres psql -U lrpp -d lrpp
```

---

## 7. URLs d'accès

| Service | URL |
|---------|-----|
| **Application Web** | http://137.74.41.101 |
| **API** | http://137.74.41.101/api |

---

## 8. Dépannage

### Les conteneurs ne démarrent pas

```bash
# Vérifier les logs
docker compose -f docker-compose.traefik.yml logs

# Vérifier que le réseau traefik-public existe
docker network ls | grep traefik
```

### Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL est healthy
docker compose -f docker-compose.traefik.yml ps

# Recréer la base de données (ATTENTION: perte de données)
docker compose -f docker-compose.traefik.yml down -v
docker compose -f docker-compose.traefik.yml up -d
```

### L'API ne répond pas

```bash
# Vérifier les logs de l'API
docker compose -f docker-compose.traefik.yml logs api

# Vérifier que Traefik route correctement
docker logs traefik
```

---

## 9. Sécurité (recommandations)

1. **Changer le mot de passe SSH** de l'utilisateur ybdn
2. **Configurer un firewall** (UFW) :
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```
3. **Configurer HTTPS** avec Let's Encrypt (décommenter les lignes dans Traefik)
4. **Sauvegardes régulières** de la base de données :
   ```bash
   docker exec lrpp-postgres pg_dump -U lrpp lrpp > backup_$(date +%Y%m%d).sql
   ```

---

## Contact

En cas de problème, vérifier :
1. Les logs Docker
2. L'état des conteneurs (`docker ps -a`)
3. La connectivité réseau (`curl http://localhost:3001/api`)
