#!/bin/bash
# Démarre l'application en mode NGROK (tunnel client unique)
# Architecture : Client(ngrok) → Vite proxy → API(localhost:3000)
# Ngrok gratuit = 1 seule URL publique → on expose uniquement le client
# Vite proxifie /api et /notifications vers localhost:3000 (pas de CORS)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cleanup() {
    echo -e "\n${RED}🛑 Arrêt de tous les services...${NC}"
    [ -n "$NGROK_PID" ] && kill $NGROK_PID 2>/dev/null || true
    [ -n "$CLIENT_PID" ] && kill $CLIENT_PID 2>/dev/null || true
    [ -n "$SERVER_PID" ] && kill $SERVER_PID 2>/dev/null || true
    pkill -f "ngrok" 2>/dev/null || true
    exit 0
}

trap cleanup INT TERM

echo -e "${BLUE}🌐 Mode NGROK (tunnel client unique)${NC}\n"

# Cleanup des ports
echo -e "${YELLOW}🧹 Nettoyage des ports...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
lsof -ti:5174 | xargs kill -9 2>/dev/null || true
# Kill ngrok by finding its PID directly (avoid pkill -9 which can kill the script)
NGROK_EXISTING=$(pgrep -x ngrok 2>/dev/null || true)
[ -n "$NGROK_EXISTING" ] && kill -9 $NGROK_EXISTING 2>/dev/null || true
sleep 2

# Supprimer .env.local pour ne pas polluer la config
rm -f "$ROOT_DIR/apps/client/.env.local"

# Démarrer le serveur API
echo -e "${YELLOW}📡 Démarrage du serveur API (port 3000)...${NC}"
cd "$ROOT_DIR/apps/server"
npm run start:dev > /tmp/server.log 2>&1 &
SERVER_PID=$!
cd "$ROOT_DIR"
sleep 5

if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${RED}❌ Le serveur API n'a pas démarré${NC}"
    cat /tmp/server.log | tail -20
    exit 1
fi
echo -e "${GREEN}✅ Serveur API démarré sur localhost:3000 (PID: $SERVER_PID)${NC}\n"

# Démarrer ngrok - tunnel CLIENT uniquement
echo -e "${YELLOW}🌐 Démarrage du tunnel ngrok (client uniquement)...${NC}"
ngrok start client --config="$ROOT_DIR/ngrok.yml" --log=stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

# Attendre le tunnel
CLIENT_URL=""
for i in {1..15}; do
    sleep 2
    TUNNELS_JSON=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null || echo "")
    if [ -n "$TUNNELS_JSON" ]; then
        CLIENT_URL=$(echo "$TUNNELS_JSON" | python3 -c "
import sys, json
d = json.load(sys.stdin)
t = [t['public_url'] for t in d.get('tunnels', [])]
print(t[0] if t else '')
" 2>/dev/null || echo "")
        if [ -n "$CLIENT_URL" ]; then
            break
        fi
    fi
    echo -e "${YELLOW}  ⏳ Attente tunnel... ($i/15)${NC}"
done

if [ -z "$CLIENT_URL" ]; then
    echo -e "${RED}❌ Impossible de démarrer le tunnel ngrok${NC}"
    cat /tmp/ngrok.log | tail -10
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}✅ Tunnel actif: ${CLIENT_URL}${NC}\n"

# Démarrer le client Vite (proxy /api → localhost:3000)
echo -e "${YELLOW}🎨 Démarrage du client (port 5173)...${NC}"
cd "$ROOT_DIR/apps/client"
npm run dev > /tmp/client.log 2>&1 &
CLIENT_PID=$!
cd "$ROOT_DIR"
sleep 6

if ! kill -0 $CLIENT_PID 2>/dev/null; then
    echo -e "${RED}❌ Le client n'a pas démarré${NC}"
    cat /tmp/client.log | tail -20
    kill $SERVER_PID $NGROK_PID 2>/dev/null || true
    exit 1
fi
echo -e "${GREEN}✅ Client démarré sur port 5173 (PID: $CLIENT_PID)${NC}\n"


echo -e "${BLUE}══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   🎉 Application prête (NGROK) !${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════${NC}\n"

echo -e "🌐 ${YELLOW}URL Publique:${NC}"
echo -e "   📱 Client: ${CYAN}${CLIENT_URL}${NC}"
echo -e "   🛠️  Admin:  ${CYAN}${CLIENT_URL}/admin${NC}\n"

echo -e "${CYAN}ℹ️  Architecture:${NC}"
echo -e "   ${CYAN}•${NC} Browser ──▶ ${CLIENT_URL} (ngrok → Vite:5173)"
echo -e "   ${CYAN}•${NC} /api/*  ──▶ Vite proxy ──▶ localhost:3000"
echo -e "   ${CYAN}•${NC} /admin  ──▶ intégré dans le client (même app)"
echo -e "   ${CYAN}•${NC} Pas de CORS (même origine)\n"

echo -e "${YELLOW}⚠️  Appuyez sur Ctrl+C pour arrêter${NC}\n"

wait $SERVER_PID $CLIENT_PID $NGROK_PID 2>/dev/null || true
