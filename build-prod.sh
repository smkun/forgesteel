#!/bin/bash
# Production Build Script
# Ensures clean environment for production builds

set -e

echo "🧹 Clearing Vite environment variables..."
unset VITE_API_BASE_URL
unset VITE_FIREBASE_API_KEY
unset VITE_FIREBASE_AUTH_DOMAIN

echo "📋 Using .env.production settings:"
grep "VITE_API_BASE_URL" .env.production

echo ""
echo "🔨 Building for production..."
npm run build

echo ""
echo "✅ Verifying production API URL in build..."
PROD_URL_COUNT=$(grep -c '32gamers.com/forgesteel' distribution/frontend/main-*.js 2>/dev/null || echo "0")

if [ "$PROD_URL_COUNT" -gt 0 ]; then
    echo "✅ SUCCESS: Production URL found in build ($PROD_URL_COUNT occurrences)"

    # Check for localhost (should NOT be present)
    LOCALHOST_COUNT=$(grep -c 'localhost:4000' distribution/frontend/main-*.js 2>/dev/null || echo "0")
    if [ "$LOCALHOST_COUNT" -gt 0 ]; then
        echo "❌ ERROR: localhost:4000 found in build! Build is corrupted."
        exit 1
    fi

    echo "✅ No localhost references found - build is clean"
    echo ""
    echo "📦 Ready to deploy: distribution/frontend/"
else
    echo "❌ ERROR: Production URL NOT found in build!"
    echo "Build may be using wrong environment."
    exit 1
fi
