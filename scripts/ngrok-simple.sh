#!/bin/bash
# Ngrok simple wrapper using CLI

PORT=${1:-5173}
NAME=${2:-tunnel}

# Kill any existing ngrok on this port
pkill -f "ngrok http $PORT" 2>/dev/null || true
sleep 1

# Start ngrok
ngrok http "$PORT" --log=stdout &
NGROK_PID=$!
sleep 5

# Get URL from ngrok API
URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$URL" ]; then
    echo "NGROK_URL_${NAME}=${URL}"
    echo "Public URL: $URL"
else
    echo "Erreur: Impossible de récupérer l'URL"
    echo "Vérifiez http://localhost:4040"
fi

wait $NGROK_PID 2>/dev/null || true
