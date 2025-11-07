#!/bin/bash

# Test Character API Endpoints
# Note: This script requires a running backend server and Firebase authentication
# For local testing without Firebase, use test-character-api.ts instead

echo "============================================================"
echo "CHARACTER API ENDPOINT TEST"
echo "============================================================"

BASE_URL="http://localhost:4000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "${YELLOW}Note: These tests require Firebase authentication${NC}"
echo "${YELLOW}To test without auth, run: npx tsx server/test-character-api.ts${NC}"
echo ""

# Test 1: Health check
echo "----------------------------------------"
echo "Test 1: Health Check"
echo "----------------------------------------"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  echo -e "${GREEN}✅ Health check passed${NC}"
  echo "$body" | jq '.'
else
  echo -e "${RED}❌ Health check failed: HTTP $http_code${NC}"
  echo "$body"
fi

# Test 2: GET /api/characters (requires auth)
echo ""
echo "----------------------------------------"
echo "Test 2: GET /api/characters (no auth)"
echo "----------------------------------------"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/characters")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "401" ]; then
  echo -e "${GREEN}✅ Correctly returns 401 Unauthorized${NC}"
  echo "$body" | jq '.'
else
  echo -e "${RED}❌ Expected 401, got HTTP $http_code${NC}"
  echo "$body"
fi

# Test 3: POST /api/characters (requires auth)
echo ""
echo "----------------------------------------"
echo "Test 3: POST /api/characters (no auth)"
echo "----------------------------------------"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/characters" \
  -H "Content-Type: application/json" \
  -d '{"hero":{"id":"test","name":"Test Hero"}}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "401" ]; then
  echo -e "${GREEN}✅ Correctly returns 401 Unauthorized${NC}"
  echo "$body" | jq '.'
else
  echo -e "${RED}❌ Expected 401, got HTTP $http_code${NC}"
  echo "$body"
fi

# Test 4: 404 handling
echo ""
echo "----------------------------------------"
echo "Test 4: 404 Error Handling"
echo "----------------------------------------"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/nonexistent")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "404" ]; then
  echo -e "${GREEN}✅ Correctly returns 404 Not Found${NC}"
  echo "$body" | jq '.'
else
  echo -e "${RED}❌ Expected 404, got HTTP $http_code${NC}"
  echo "$body"
fi

echo ""
echo "============================================================"
echo "ENDPOINT TESTS COMPLETE"
echo "============================================================"
echo ""
echo "${YELLOW}To test authenticated endpoints:${NC}"
echo "1. Get a Firebase ID token from the frontend"
echo "2. Use: curl -H \"Authorization: Bearer \$TOKEN\" $BASE_URL/api/characters"
echo ""
