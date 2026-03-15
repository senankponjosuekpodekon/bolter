#!/bin/bash

# Script de publication des images Docker vers Docker Hub
# Usage: ./push-images.sh <votre-username-dockerhub>

if [ -z "$1" ]; then
  echo "Usage: ./push-images.sh <docker-hub-username>"
  exit 1
fi

DOCKER_USER=$1

echo "🚀 Publication des images Docker vers Docker Hub"
echo "================================================"
echo ""

# Login Docker Hub
echo "📝 Connexion à Docker Hub..."
docker login

# Tag et push server
echo ""
echo "📦 Publication bolter-server..."
docker tag bolter-server:latest $DOCKER_USER/bolter-server:latest
docker push $DOCKER_USER/bolter-server:latest

# Tag et push client
echo ""
echo "📦 Publication bolter-client..."
docker tag bolter-client:latest $DOCKER_USER/bolter-client:latest
docker push $DOCKER_USER/bolter-client:latest

# Tag et push admin
echo ""
echo "📦 Publication bolter-admin..."
docker tag bolter-admin:latest $DOCKER_USER/bolter-admin:latest
docker push $DOCKER_USER/bolter-admin:latest

echo ""
echo "✅ Images publiées avec succès!"
echo ""
echo "Pour déployer sur un autre PC :"
echo "1. Copier docker-compose.prod.yml et .env"
echo "2. Exécuter: docker compose -f docker-compose.prod.yml up -d"
