#!/bin/bash
# Ngrok tunnel script using CLI (more reliable than npm package)
# Usage: ./ngrok-cli.sh [client|api|admin|all]

set -e

COMMAND="${1:-api}"
REGION="${NGROK_REGION:-eu}"
AUTH_TOKEN="${NGROK_AUTH_TOKEN:-$NGROK_AUTHTOKEN}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if ngrok CLI is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}❌ ngrok CLI not found${NC}"
    echo "Install with: npm install -g ngrok"
    echo "Or download from: https://ngrok.com/download"
    exit 1
fi

# Configure auth token if provided
if [ -n "$AUTH_TOKEN" ]; then
    ngrok config add-authtoken "$AUTH_TOKEN" 2>/dev/null || true
fi

# Function to start tunnel
start_tunnel() {
    local port=$1
    local name=$2
    local color=$3
    
    echo -e "${color}🌐 Starting $name tunnel on port $port...${NC}"
    ngrok http "$port" --region="$REGION" &
    sleep 2
    
    # Get the public URL from ngrok API
    local url=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | grep https | head -1 | cut -d'"' -f4)
    
    if [ -n "$url" ]; then
        echo -e "${GREEN}✅ $name tunnel ready!${NC}"
        echo -e "   Public URL: ${BLUE}$url${NC}"
        echo -e "   Local: http://localhost:$port"
        echo ""
    else
        echo -e "${YELLOW}⚠️  Tunnel starting... check http://localhost:4040${NC}"
    fi
}

echo -e "${BLUE}🚀 Starting ngrok tunnels...${NC}"
echo ""

case "$COMMAND" in
    client)
        start_tunnel 5173 "Client" "$GREEN"
        echo -e "${GREEN}Share this URL with your client${NC}"
        ;;
        
    api)
        start_tunnel 3000 "API" "$BLUE"
        echo -e "${BLUE}API endpoints available at the URL above${NC}"
        echo -e "   Swagger docs: /api/docs"
        ;;
        
    admin)
        start_tunnel 5174 "Admin" "$YELLOW"
        echo -e "${YELLOW}Admin panel available at the URL above${NC}"
        ;;
        
    all)
        echo -e "${BLUE}Starting all tunnels in parallel...${NC}"
        echo ""
        
        # Start all tunnels in background
        ngrok http 5173 --region="$REGION" --log=stdout > /tmp/ngrok-client.log 2>&1 &
        sleep 1
        ngrok http 3000 --region="$REGION" --log=stdout > /tmp/ngrok-api.log 2>&1 &
        sleep 1
        ngrok http 5174 --region="$REGION" --log=stdout > /tmp/ngrok-admin.log 2>&1 &
        sleep 2
        
        # Get URLs from ngrok web interface
        echo -e "${GREEN}✅ All tunnels started!${NC}"
        echo ""
        echo -e "${YELLOW}📋 Access your tunnels at:${NC}"
        echo -e "   ${BLUE}http://localhost:4040${NC} (ngrok web interface)"
        echo ""
        echo -e "${YELLOW}To see URLs, run:${NC}"
        echo -e "   curl http://localhost:4040/api/tunnels | grep public_url"
        echo ""
        ;;
        
    *)
        echo "Usage: $0 [client|api|admin|all]"
        echo ""
        echo "Commands:"
        echo "  client - Tunnel frontend (port 5173)"
        echo "  api    - Tunnel backend API (port 3000)"
        echo "  admin  - Tunnel admin panel (port 5174)"
        echo "  all    - Tunnel all services"
        exit 1
        ;;
esac

echo -e "${YELLOW}⚠️  Press Ctrl+C to stop all tunnels${NC}"

# Wait for interrupt
trap "echo ''; echo -e '${RED}🛑 Stopping tunnels...${NC}'; killall ngrok 2>/dev/null || true; exit 0" INT
wait
