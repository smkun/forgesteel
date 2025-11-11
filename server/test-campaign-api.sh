#!/bin/bash

# Campaign API Testing Script
# Tests the campaign endpoints with simple curl commands

API_BASE="http://localhost:4000/api"
AUTH_TOKEN=""

echo "================================"
echo "Campaign API Testing"
echo "================================"
echo ""

# Note: You need to provide a valid Firebase auth token
echo "To test, you need to:"
echo "1. Get your Firebase auth token from the browser (check localStorage or network tab)"
echo "2. Export it: export FIREBASE_TOKEN='your-token-here'"
echo "3. Run this script"
echo ""

if [ -z "$FIREBASE_TOKEN" ]; then
    echo "❌ FIREBASE_TOKEN environment variable not set"
    echo "   Cannot proceed with API tests"
    exit 1
fi

AUTH_TOKEN="$FIREBASE_TOKEN"

echo "✅ Auth token found"
echo ""

# Test 1: Get all campaigns
echo "================================"
echo "Test 1: GET /api/campaigns"
echo "================================"
curl -s -X GET "$API_BASE/campaigns" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# Test 2: Create a campaign
echo "================================"
echo "Test 2: POST /api/campaigns"
echo "================================"
CAMPAIGN_DATA='{
  "name": "Test Campaign",
  "description": "A test campaign for API verification"
}'

CAMPAIGN_RESPONSE=$(curl -s -X POST "$API_BASE/campaigns" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$CAMPAIGN_DATA")

echo "$CAMPAIGN_RESPONSE" | jq '.'
CAMPAIGN_ID=$(echo "$CAMPAIGN_RESPONSE" | jq -r '.id')
echo ""
echo "Created campaign ID: $CAMPAIGN_ID"
echo ""

# Test 3: Get campaign by ID
echo "================================"
echo "Test 3: GET /api/campaigns/$CAMPAIGN_ID"
echo "================================"
curl -s -X GET "$API_BASE/campaigns/$CAMPAIGN_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# Test 4: Get campaign members
echo "================================"
echo "Test 4: GET /api/campaigns/$CAMPAIGN_ID/members"
echo "================================"
curl -s -X GET "$API_BASE/campaigns/$CAMPAIGN_ID/members" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# Test 5: Update campaign
echo "================================"
echo "Test 5: PUT /api/campaigns/$CAMPAIGN_ID"
echo "================================"
UPDATE_DATA='{
  "name": "Updated Test Campaign",
  "description": "Updated description"
}'

curl -s -X PUT "$API_BASE/campaigns/$CAMPAIGN_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_DATA" | jq '.'
echo ""

# Test 6: Get campaign characters (should be empty)
echo "================================"
echo "Test 6: GET /api/campaigns/$CAMPAIGN_ID/characters"
echo "================================"
curl -s -X GET "$API_BASE/campaigns/$CAMPAIGN_ID/characters" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# Test 7: Delete campaign
echo "================================"
echo "Test 7: DELETE /api/campaigns/$CAMPAIGN_ID"
echo "================================"
curl -s -X DELETE "$API_BASE/campaigns/$CAMPAIGN_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

echo "================================"
echo "Testing Complete"
echo "================================"
