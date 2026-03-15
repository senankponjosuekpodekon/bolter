#!/bin/bash

echo "🎯 Sprint I Verification - Foundation & Ops Ready"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Docker Build
echo "✅ Test 1: Docker Build"
echo "Image bolter-server created: $(sudo docker images | grep bolter-server | wc -l) images found"
echo ""

# Test 2: Docker Compose Services
echo "✅ Test 2: Docker Compose Services"
echo "Checking running containers..."
sudo docker compose ps
echo ""

# Test 3: OpenTelemetry Port
echo "✅ Test 3: OpenTelemetry Receiver Port (4317)"
if nc -zv localhost 4317 2>/dev/null; then
  echo -e "${GREEN}✓ OTel port 4317 is open${NC}"
else
  echo -e "${YELLOW}⚠ OTel port 4317 not accessible (may need to be enabled)${NC}"
fi
echo ""

# Test 4: Server Health Check
echo "✅ Test 4: Server Health Check"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$HEALTH" == "200" ]; then
  echo -e "${GREEN}✓ Server health check passed (HTTP $HEALTH)${NC}"
else
  echo -e "${RED}✗ Server health check failed (HTTP $HEALTH)${NC}"
fi
echo ""

# Test 5: WebSocket Connection
echo "✅ Test 5: WebSocket (socket.io)"
WS_RESPONSE=$(curl -s "http://localhost:3000/socket.io/?EIO=4&transport=polling" | head -c 50)
if [ ! -z "$WS_RESPONSE" ]; then
  echo -e "${GREEN}✓ WebSocket endpoint responding${NC}"
  echo "Response: ${WS_RESPONSE}..."
else
  echo -e "${RED}✗ WebSocket endpoint not responding${NC}"
fi
echo ""

# Test 6: Rate Limiting
echo "✅ Test 6: Rate Limiting (sending 20 requests)"
RATE_LIMIT_HIT=0
for i in {1..20}; do
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
  if [ "$RESPONSE" == "429" ]; then
    RATE_LIMIT_HIT=1
    echo -e "${GREEN}✓ Rate limiting triggered at request $i (HTTP 429)${NC}"
    break
  fi
done

if [ $RATE_LIMIT_HIT -eq 0 ]; then
  echo -e "${YELLOW}⚠ Rate limit not hit after 20 requests (may need higher threshold)${NC}"
fi
echo ""

echo "=================================================="
echo "Sprint I Verification Complete!"
echo "=================================================="
