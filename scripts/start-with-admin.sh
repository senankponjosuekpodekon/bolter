#!/bin/bash
# Démarre avec tunnel ngrok sur l'ADMIN (au lieu du client)
# L'admin sera accessible publiquement, le client reste local

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

cleanup() {
    echo -e "\n${RED}🛑 Arrêt de tous les services...${NC}"
    kill $SERVER_PID $CLIENT_PID $ADMIN_PID $NGROK_PID 2>/dev/null || true
    killall ngrok 2>/dev/null || true
    exit 0
}

trap cleanup INT TERM

echo -e "${BLUE}🚀 Mode: Admin avec ngrok (Client en local)${NC}\n"

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

# Démarrer le client (local uniquement)
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

# Démarrer l'admin
echo -e "${YELLOW}🛠️  Démarrage de l'admin (port 5174)...${NC}"
cd apps/admin
npm run dev -- --port 5174 > /tmp/admin.log 2>&1 &
ADMIN_PID=$!
cd ../..
sleep 3

if ! kill -0 $ADMIN_PID 2>/dev/null; then
    echo -e "${RED}❌ L'admin n'a pas démarré${NC}"
    cat /tmp/admin.log
    kill $SERVER_PID $CLIENT_PID 2>/dev/null || true
    exit 1
fi
echo -e "${GREEN}✅ Admin démarré (PID: $ADMIN_PID)${NC}\n"

# Démarrer ngrok sur l'ADMIN (pas le client)
echo -e "${YELLOW}🌐 Démarrage du tunnel ngrok (Admin uniquement)...${NC}"
ngrok http 5174 --log=stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

# Attendre que le tunnel soit prêt
ADMIN_URL=""
for i in {1..10}; do
    sleep 2
    TUNNELS_JSON=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null || echo "")
    if [ -n "$TUNNELS_JSON" ]; then
        ADMIN_URL=$(echo "$TUNNELS_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['tunnels'][0]['public_url'] if d['tunnels'] else '')" 2>/dev/null || echo "")
        if [ -n "$ADMIN_URL" ]; then
            break
        fi
    fi
    echo -e "${YELLOW}  ⏳ Attente du tunnel... ($i/10)${NC}"
done

if [ -z "$ADMIN_URL" ]; then
    echo -e "${RED}❌ Impossible de récupérer l'URL ngrok${NC}"
    echo -e "   Vérifiez: http://localhost:4040"
else
    echo -e "${GREEN}✅ Ngrok démarré${NC}\n"
fi

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}   🎉 Application prête !${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

if [ -n "$ADMIN_URL" ]; then
    echo -e "🔗 ${YELLOW}URL Admin (à partager):${NC} ${GREEN}${ADMIN_URL}${NC}"
    echo -e "   ${CYAN}└─▶ Accès complet à l'interface admin${NC}"
fi

echo -e "📱 ${YELLOW}Client local:${NC} http://localhost:5173"
echo -e "🛠️  ${YELLOW}Admin local:${NC} http://localhost:5174"
echo -e "🔌 ${YELLOW}API local:${NC} http://localhost:3000"
echo -e "📊 ${YELLOW}Ngrok UI:${NC} http://localhost:4040\n"

echo -e "${YELLOW}⚠️  Appuyez sur Ctrl+C pour arrêter tous les services${NC}\n"

# Afficher les logs
tail -f /tmp/server.log /tmp/client.log /tmp/admin.log /tmp/ngrok.log 2>/dev/null | head -500 &
TAIL_PID=$!

wait $SERVER_PID $CLIENT_PID $ADMIN_PID $NGROK_PID 2>/dev/null || true
kill $TAIL_PID 2>/dev/null || true
