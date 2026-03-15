# Guide de Déploiement Docker (Sans Code Source)

Ce guide explique comment déployer le projet Bolter sur un autre PC en utilisant uniquement les images Docker, **sans avoir besoin du code source**.

---

## 📦 Étape 1 : Publication des Images (PC de Développement)

### 1.1 Créer un compte Docker Hub
Si vous n'en avez pas : https://hub.docker.com/signup

### 1.2 Publier les images

```bash
# Rendre le script exécutable
chmod +x push-images.sh

# Publier les images (remplacer 'votre-username' par votre username Docker Hub)
./push-images.sh votre-username

# Le script va :
# - Vous demander de vous connecter à Docker Hub
# - Tagger les 3 images (server, client, admin)
# - Les pousser vers Docker Hub
```

**Exemple** :
```bash
./push-images.sh johndoe
# Publiera:
# - johndoe/bolter-server:latest
# - johndoe/bolter-client:latest
# - johndoe/bolter-admin:latest
```

---

## 🚀 Étape 2 : Déploiement sur un Autre PC

### 2.1 Prérequis sur le PC cible
- Docker installé : `docker --version`
- Docker Compose installé : `docker compose version`

### 2.2 Fichiers à copier

Copier sur le PC cible :
```
deploiement/
├── docker-compose.prod.yml
├── .env
└── otel-collector-config.yaml
```

### 2.3 Configurer docker-compose.prod.yml

Éditer `docker-compose.prod.yml` et remplacer `<DOCKER_USER>` par votre username :

```yaml
server:
  image: johndoe/bolter-server:latest  # ← Votre username
  
client:
  image: johndoe/bolter-client:latest  # ← Votre username
  
admin:
  image: johndoe/bolter-admin:latest   # ← Votre username
```

**Ou** utiliser sed pour automatiser :
```bash
sed -i 's/<DOCKER_USER>/johndoe/g' docker-compose.prod.yml
```

### 2.4 Configurer les variables d'environnement

Créer/éditer le fichier `.env` :

```env
# Base de données
POSTGRES_DB=bolter
POSTGRES_USER=postgres
POSTGRES_PASSWORD=VotreMotDePasseSecurise123!
POSTGRES_PORT=5432

# Redis
REDIS_PORT=6379

# Serveur
NODE_ENV=production
SERVER_PORT=3000

# Supabase (OBLIGATOIRE)
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# JWT
JWT_SECRET=VotreCleSecrete256BitsMinimum!
JWT_EXPIRATION=3600
JWT_REFRESH_SECRET=VotreCleRefreshSecrete256Bits!
JWT_REFRESH_EXPIRATION=2592000

# Email (Optionnel)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-mot-de-passe-app
EMAIL_FROM=noreply@bolter.com

# Google OAuth (Optionnel)
GOOGLE_CLIENT_ID=votre-google-client-id
GOOGLE_CLIENT_SECRET=votre-google-client-secret

# Frontend
CLIENT_PORT=5173
ADMIN_PORT=5174
VITE_API_URL=http://localhost:3000
VITE_NOTIFICATIONS_URL=http://localhost:3000
```

### 2.5 Lancer le déploiement

```bash
# Télécharger les images depuis Docker Hub
docker compose -f docker-compose.prod.yml pull

# Démarrer tous les services
docker compose -f docker-compose.prod.yml up -d

# Vérifier le statut
docker compose -f docker-compose.prod.yml ps

# Voir les logs
docker compose -f docker-compose.prod.yml logs -f
```

### 2.6 Vérifier le déploiement

```bash
# Test des services
curl http://localhost:3000/api/health  # Server
curl http://localhost:5173             # Client
curl http://localhost:5174             # Admin

# Ou ouvrir dans le navigateur
```

---

## 🔄 Mises à Jour

### Sur le PC de développement (après modifications) :

```bash
# 1. Rebuild les images
docker compose build

# 2. Re-publier vers Docker Hub
./push-images.sh votre-username
```

### Sur le PC de production :

```bash
# 1. Télécharger les nouvelles versions
docker compose -f docker-compose.prod.yml pull

# 2. Redémarrer avec les nouvelles images
docker compose -f docker-compose.prod.yml up -d

# 3. Supprimer les anciennes images
docker image prune -f
```

---

## 🛠️ Gestion des Services

### Arrêter les services
```bash
docker compose -f docker-compose.prod.yml stop
```

### Redémarrer les services
```bash
docker compose -f docker-compose.prod.yml restart
```

### Arrêter et supprimer les conteneurs
```bash
docker compose -f docker-compose.prod.yml down
```

### Arrêter et supprimer TOUT (conteneurs + volumes)
⚠️ Supprime aussi les données de la base !
```bash
docker compose -f docker-compose.prod.yml down -v
```

### Voir les logs d'un service spécifique
```bash
docker logs bolter-server -f
docker logs bolter-client -f
docker logs bolter-admin -f
```

---

## 📊 Monitoring

### Status des conteneurs
```bash
docker compose -f docker-compose.prod.yml ps
```

### Utilisation des ressources
```bash
docker stats
```

### Espace disque utilisé
```bash
docker system df
```

---

## 🔒 Sécurité en Production

### 1. Ne pas exposer tous les ports
Dans `docker-compose.prod.yml`, commentez les ports non nécessaires :

```yaml
postgres:
  ports:
    # - "5432:5432"  # ← Commenté pour ne pas exposer Postgres
```

### 2. Utiliser un reverse proxy (Nginx/Traefik)
Au lieu d'exposer les ports directement, utilisez un proxy :

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf
```

### 3. Secrets Docker
Au lieu de `.env`, utilisez Docker secrets :

```bash
echo "mon-mot-de-passe" | docker secret create postgres_password -
```

---

## 🌐 Déploiement sur un Serveur Distant

### Via SSH :

```bash
# 1. Copier les fichiers
scp docker-compose.prod.yml .env otel-collector-config.yaml user@serveur:/path/to/app/

# 2. Se connecter
ssh user@serveur

# 3. Déployer
cd /path/to/app
docker compose -f docker-compose.prod.yml up -d
```

### Avec Docker Context (recommandé) :

```bash
# 1. Créer un context distant
docker context create remote --docker "host=ssh://user@serveur"

# 2. Utiliser le context
docker context use remote

# 3. Déployer comme en local
docker compose -f docker-compose.prod.yml up -d

# 4. Revenir au context local
docker context use default
```

---

## 🐳 Utiliser un Registry Privé (Alternatif à Docker Hub)

### 1. Lancer un registry privé

```bash
docker run -d -p 5000:5000 --restart=always --name registry registry:2
```

### 2. Modifier push-images.sh

```bash
REGISTRY=localhost:5000

docker tag bolter-server:latest $REGISTRY/bolter-server:latest
docker push $REGISTRY/bolter-server:latest
```

### 3. Modifier docker-compose.prod.yml

```yaml
server:
  image: registry.votre-domaine.com:5000/bolter-server:latest
```

---

## ✅ Checklist de Déploiement

**Avant déploiement** :
- [ ] Images publiées sur Docker Hub
- [ ] Fichier `.env` configuré avec les vraies valeurs
- [ ] `<DOCKER_USER>` remplacé dans docker-compose.prod.yml
- [ ] Ports disponibles sur le serveur cible

**Après déploiement** :
- [ ] Tous les services sont UP : `docker compose ps`
- [ ] Healthchecks en vert : Server, Postgres, Redis
- [ ] Endpoints accessibles : /api/health, frontend, admin
- [ ] Logs sans erreurs : `docker compose logs`

---

## 🆘 Dépannage

### Les images ne se téléchargent pas
```bash
# Vérifier la connexion Docker Hub
docker login

# Forcer le re-téléchargement
docker compose -f docker-compose.prod.yml pull --no-cache
```

### Un service ne démarre pas
```bash
# Voir les logs
docker logs bolter-server --tail 100

# Redémarrer le service
docker compose -f docker-compose.prod.yml restart server
```

### Problème de permissions
```bash
# Vérifier les volumes
docker volume ls
docker volume inspect bolter_postgres_data

# Recréer les volumes
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d
```

---

## 📁 Structure Minimale pour Déploiement

```
deploiement/
├── docker-compose.prod.yml   # Configuration Docker Compose
├── .env                       # Variables d'environnement
├── otel-collector-config.yaml # Config OpenTelemetry
└── README-DEPLOY.md          # Ce fichier
```

**C'est tout !** Pas besoin du code source ni de `node_modules`.

---

## 🔗 Ressources

- [Docker Hub](https://hub.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Context](https://docs.docker.com/engine/context/working-with-contexts/)
