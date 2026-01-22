#!/bin/bash

# Script pour construire l'image Docker avec plusieurs tentatives
MAX_RETRIES=3
RETRY_COUNT=0

echo "🚀 Construction de l'image Docker bolter-server..."

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "Tentative $((RETRY_COUNT + 1))/$MAX_RETRIES..."
    
    sudo docker build \
        --network=host \
        -f apps/server/Dockerfile \
        -t bolter-server \
        --build-arg NPM_CONFIG_FETCH_TIMEOUT=600000 \
        --build-arg NPM_CONFIG_FETCH_RETRIES=5 \
        .
    
    if [ $? -eq 0 ]; then
        echo "✅ Construction réussie !"
        exit 0
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo "⚠️  Échec, nouvelle tentative dans 10 secondes..."
        sleep 10
    fi
done

echo "❌ Échec après $MAX_RETRIES tentatives"
exit 1
