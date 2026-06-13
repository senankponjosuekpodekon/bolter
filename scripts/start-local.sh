#!/bin/bash
# Démarre l'application en mode LOCAL uniquement (sans ngrok)
# API + Client sur localhost

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cleanup() {
    echo -e "\n${RED}🛑 Arrêt de tous les services...${NC}"
    kill $SERVER_PID $CLIENT_PID 2>/dev/null || true
    exit 0
}

trap cleanup INT TERM

echo -e "${BLUE}🚀 Mode LOCAL (sans ngrok)${NC}\n"

# Cleanup des ports
echo -e "${YELLOW}🧹 Nettoyage des ports...${NC}"
kill $(lsof -t -i:3000) 2>/dev/null || true
kill $(lsof -t -i:5173) 2>/dev/null || true
sleep 2

# IMPORTANT : Supprimer .env.local pour éviter les URLs ngrok périmées
echo -e "${YELLOW}🗑️  Suppression de .env.local (URLs ngrok)...${NC}"
rm -f apps/client/.env.local
echo -e "${GREEN}✅ Configuration locale propre${NC}\n"

# Démarrer le serveur API
echo -e "${YELLOW}📡 Démarrage du serveur API (port 3000)...${NC}"
cd apps/server
npm run start:dev > /tmp/server.log 2>&1 &
SERVER_PID=$!
cd ../..
sleep 3

if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${RED}❌ Le serveur API n'a pas démarré${NC}"
    cat /tmp/server.log
    exit 1
fi
echo -e "${GREEN}✅ Serveur API démarré (PID: $SERVER_PID)${NC}\n"

# Démarrer le client
echo -e "${YELLOW}🎨 Démarrage du client (port 5173)...${NC}"
cd apps/client
npm run dev > /tmp/client.log 2>&1 &
CLIENT_PID=$!
cd ../..
sleep 5

if ! kill -0 $CLIENT_PID 2>/dev/null; then
    echo -e "${RED}❌ Le client n'a pas démarré${NC}"
    cat /tmp/client.log
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
echo -e "${GREEN}✅ Client démarré (PID: $CLIENT_PID)${NC}\n"

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}   🎉 Application prête (LOCAL) !${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

echo -e "📱 ${YELLOW}Client:${NC} http://localhost:5173"
echo -e "🛠️  ${YELLOW}Admin:${NC} http://localhost:5173/admin"
echo -e "🔌 ${YELLOW}API:${NC} http://localhost:3000"
echo -e "📊 ${YELLOW}API Docs:${NC} http://localhost:3000/api\n"

echo -e "${CYAN}ℹ️  Architecture:${NC}"
echo -e "   ${CYAN}•${NC} Client ──▶ Proxy Vite ──▶ API (localhost:3000)"
echo -e "   ${CYAN}•${NC} Pas de CORS (même origine)\n"

echo -e "${YELLOW}⚠️  Appuyez sur Ctrl+C pour arrêter${NC}\n"

# Logs
tail -f /tmp/server.log /tmp/client.log 2>/dev/null | head -500 &
TAIL_PID=$!

wait $SERVER_PID $CLIENT_PID 2>/dev/null || true
kill $TAIL_PID 2>/dev/null || true
