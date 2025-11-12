#!/bin/bash

# Production Deployment Verification Script
# Helps diagnose why campaign routes return 404 in production

echo "==================================================="
echo "Production Deployment Verification"
echo "==================================================="
echo ""

# Configuration
PROD_DOMAIN="${1:-https://32gamers.com}"
PROD_API_PATH="/forgesteel"

echo "Testing production deployment at: ${PROD_DOMAIN}${PROD_API_PATH}"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "---------------------------------------------------"
echo "Test 1: Health Check Endpoint"
echo "---------------------------------------------------"
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${PROD_DOMAIN}${PROD_API_PATH}/healthz")
HTTP_STATUS=$(echo "$HEALTH_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed (200)${NC}"
    echo "Response: $RESPONSE_BODY"

    # Extract timestamp if available
    TIMESTAMP=$(echo "$RESPONSE_BODY" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$TIMESTAMP" ]; then
        echo "Backend timestamp: $TIMESTAMP"
    fi
else
    echo -e "${RED}✗ Health check failed (HTTP $HTTP_STATUS)${NC}"
    echo "Response: $RESPONSE_BODY"
    echo ""
    echo "Backend is NOT running. Fix this first before checking routes."
    exit 1
fi
echo ""

# Test 2: Campaigns Endpoint (requires auth, expect 401 or 200, NOT 404)
echo "---------------------------------------------------"
echo "Test 2: Campaigns Endpoint (No Auth)"
echo "---------------------------------------------------"
CAMPAIGNS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${PROD_DOMAIN}${PROD_API_PATH}/campaigns")
CAMPAIGNS_STATUS=$(echo "$CAMPAIGNS_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
CAMPAIGNS_BODY=$(echo "$CAMPAIGNS_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$CAMPAIGNS_STATUS" = "404" ]; then
    echo -e "${RED}✗ Campaigns endpoint NOT FOUND (404)${NC}"
    echo "This means campaign routes are NOT registered in production."
    echo ""
    echo "Possible causes:"
    echo "  1. Old backend build deployed (missing campaign.routes.cjs)"
    echo "  2. Backend crashed and restarted from old code"
    echo "  3. Campaign routes file not uploaded to production"
    echo ""
    echo -e "${YELLOW}ACTION REQUIRED:${NC}"
    echo "  1. Upload latest distribution/backend/routes/campaign.routes.cjs to production"
    echo "  2. Restart Passenger: touch ~/forgesteel-api/tmp/restart.txt"
    echo "  3. Re-run this script to verify fix"
elif [ "$CAMPAIGNS_STATUS" = "401" ]; then
    echo -e "${GREEN}✓ Campaigns endpoint EXISTS (401 Unauthorized - expected)${NC}"
    echo "Route is registered correctly. 401 is expected without auth token."
    echo ""
    echo "Frontend error is likely authentication-related, not missing route."
elif [ "$CAMPAIGNS_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Campaigns endpoint EXISTS and responded (200)${NC}"
    echo "Response: $CAMPAIGNS_BODY"
else
    echo -e "${YELLOW}⚠ Unexpected status: $CAMPAIGNS_STATUS${NC}"
    echo "Response: $CAMPAIGNS_BODY"
fi
echo ""

# Test 3: List all registered routes (if backend supports it)
echo "---------------------------------------------------"
echo "Test 3: Check Backend File Modification Times"
echo "---------------------------------------------------"
echo "Local build file checksums:"
echo ""
md5sum distribution/backend/routes/*.cjs 2>/dev/null | awk '{print $2 ": " $1}' || echo "  (distribution/backend/ not found locally)"
echo ""
echo -e "${YELLOW}Compare these checksums with production files:${NC}"
echo "  SSH to production and run:"
echo "  cd ~/forgesteel-api/routes && md5sum *.cjs"
echo ""

# Summary
echo "==================================================="
echo "Summary"
echo "==================================================="
echo ""
if [ "$HTTP_STATUS" = "200" ] && [ "$CAMPAIGNS_STATUS" != "404" ]; then
    echo -e "${GREEN}✓ Backend is running${NC}"
    echo -e "${GREEN}✓ Campaign routes are registered${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Check browser console for actual error details"
    echo "  2. Verify authentication token is being sent correctly"
    echo "  3. Check CORS configuration if cross-origin requests"
elif [ "$HTTP_STATUS" = "200" ] && [ "$CAMPAIGNS_STATUS" = "404" ]; then
    echo -e "${GREEN}✓ Backend is running${NC}"
    echo -e "${RED}✗ Campaign routes NOT registered${NC}"
    echo ""
    echo "ACTION REQUIRED:"
    echo "  1. Upload distribution/backend/routes/campaign.routes.cjs to production"
    echo "  2. Verify distribution/backend/index.cjs includes campaign route registration"
    echo "  3. Restart backend: touch ~/forgesteel-api/tmp/restart.txt"
    echo "  4. Re-run this script to verify"
else
    echo -e "${RED}✗ Backend is NOT running or not accessible${NC}"
    echo ""
    echo "Fix backend startup first before debugging routes."
fi
echo ""

# Local build verification
echo "==================================================="
echo "Local Build Verification"
echo "==================================================="
echo ""

if [ -f "distribution/backend/index.cjs" ]; then
    echo "Checking local build for campaign route registration..."
    if grep -q "campaign.routes.cjs" distribution/backend/index.cjs; then
        echo -e "${GREEN}✓ Campaign routes ARE registered in local build${NC}"

        if grep -q "'/api/campaigns'" distribution/backend/index.cjs; then
            echo -e "${GREEN}✓ Route path '/api/campaigns' found in local build${NC}"
        fi
    else
        echo -e "${RED}✗ Campaign routes NOT found in local build${NC}"
        echo "Run 'npm run build' to rebuild backend"
    fi
else
    echo -e "${YELLOW}⚠ Local build not found (distribution/backend/index.cjs)${NC}"
    echo "Run 'npm run build' to create local build"
fi
echo ""

echo "==================================================="
echo "Deployment Checklist"
echo "==================================================="
echo ""
echo "Files that MUST be uploaded to production:"
echo "  ✓ distribution/backend/index.cjs"
echo "  ✓ distribution/backend/routes/campaign.routes.cjs"
echo "  ✓ distribution/backend/logic/campaign.logic.cjs"
echo "  ✓ distribution/backend/data/campaigns.repository.cjs"
echo "  ✓ All other distribution/backend/* files"
echo ""
echo "After upload:"
echo "  1. SSH to production"
echo "  2. cd ~/forgesteel-api"
echo "  3. ls -la routes/campaign.routes.cjs  # Verify file exists"
echo "  4. mkdir -p tmp && touch tmp/restart.txt  # Restart Passenger"
echo "  5. tail -f ~/logs/passenger.log  # Watch for startup"
echo ""
