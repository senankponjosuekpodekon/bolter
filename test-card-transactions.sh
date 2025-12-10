#!/bin/bash

# Card Transactions Test Script
# This script tests the card transaction endpoints

API_URL="http://localhost:3000"
TOKEN="YOUR_JWT_TOKEN"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Card Transactions API Test ===${NC}\n"

# Test 1: Create Account
echo -e "${YELLOW}Test 1: Creating account with currency...${NC}"
ACCOUNT_RESPONSE=$(curl -s -X POST $API_URL/accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Account",
    "currency": "EUR",
    "limit": 1000
  }')

ACCOUNT_ID=$(echo $ACCOUNT_RESPONSE | jq -r '.id')
echo "Account Created: $ACCOUNT_ID"
echo $ACCOUNT_RESPONSE | jq '.' 2>/dev/null || echo $ACCOUNT_RESPONSE
echo ""

# Test 2: Create Card
echo -e "${YELLOW}Test 2: Creating virtual card...${NC}"
CARD_RESPONSE=$(curl -s -X POST $API_URL/cards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"accountId\": \"$ACCOUNT_ID\",
    \"type\": \"VIRTUAL\"
  }")

CARD_ID=$(echo $CARD_RESPONSE | jq -r '.id')
echo "Card Created: $CARD_ID"
echo $CARD_RESPONSE | jq '.' 2>/dev/null || echo $CARD_RESPONSE
echo ""

# Test 3: Create Card Transaction (Success)
echo -e "${YELLOW}Test 3: Creating successful card transaction...${NC}"
TRANSACTION_RESPONSE=$(curl -s -X POST $API_URL/transactions/card \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"cardId\": \"$CARD_ID\",
    \"amount\": 50.00,
    \"merchant\": \"Coffee Shop\",
    \"category\": \"food-beverage\",
    \"description\": \"Morning coffee\"
  }")

echo "Transaction Response:"
echo $TRANSACTION_RESPONSE | jq '.' 2>/dev/null || echo $TRANSACTION_RESPONSE
TRANSACTION_ID=$(echo $TRANSACTION_RESPONSE | jq -r '.id' 2>/dev/null)
echo ""

# Test 4: Verify Balance Updated
echo -e "${YELLOW}Test 4: Verifying account balance...${NC}"
ACCOUNT_CHECK=$(curl -s -X GET $API_URL/accounts/$ACCOUNT_ID \
  -H "Authorization: Bearer $TOKEN")

echo "Updated Account Balance:"
echo $ACCOUNT_CHECK | jq '.balance' 2>/dev/null || echo $ACCOUNT_CHECK
echo ""

# Test 5: List Transactions
echo -e "${YELLOW}Test 5: Listing transactions...${NC}"
TRANSACTIONS_LIST=$(curl -s -X GET $API_URL/transactions \
  -H "Authorization: Bearer $TOKEN")

echo "Transactions:"
echo $TRANSACTIONS_LIST | jq '.[0:3]' 2>/dev/null || echo $TRANSACTIONS_LIST
echo ""

# Test 6: Test Insufficient Balance Error
echo -e "${YELLOW}Test 6: Testing insufficient balance error...${NC}"
ERROR_RESPONSE=$(curl -s -X POST $API_URL/transactions/card \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"cardId\": \"$CARD_ID\",
    \"amount\": 5000.00,
    \"merchant\": \"Test\",
    \"category\": \"test\"
  }")

echo "Error Response (Expected):"
echo $ERROR_RESPONSE | jq '.message' 2>/dev/null || echo $ERROR_RESPONSE
echo ""

# Test 7: Test Invalid Card Error
echo -e "${YELLOW}Test 7: Testing invalid card error...${NC}"
INVALID_RESPONSE=$(curl -s -X POST $API_URL/transactions/card \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"cardId\": \"00000000-0000-0000-0000-000000000000\",
    \"amount\": 10.00,
    \"merchant\": \"Test\",
    \"category\": \"test\"
  }")

echo "Invalid Card Response (Expected):"
echo $INVALID_RESPONSE | jq '.message' 2>/dev/null || echo $INVALID_RESPONSE
echo ""

echo -e "${GREEN}=== Tests Complete ===${NC}"
echo ""
echo -e "${YELLOW}Summary:${NC}"
echo "- Account ID: $ACCOUNT_ID"
echo "- Card ID: $CARD_ID"
echo "- Transaction ID: $TRANSACTION_ID (if successful)"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Replace YOUR_JWT_TOKEN with a valid JWT token"
echo "2. Ensure server is running on http://localhost:3000"
echo "3. Check logs for any errors"
echo "4. Verify database contains the created records"
