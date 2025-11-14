#!/bin/bash

# Sync Production Data to Local Database
# Exports characters, users, and campaigns from production and imports to local

set -e

echo "🔄 Syncing production data to local database..."
echo ""

# Production database credentials (from .env.production or manual input)
read -p "Production DB Host [edb35.awardspace.net]: " PROD_HOST
PROD_HOST=${PROD_HOST:-edb35.awardspace.net}

read -p "Production DB Name [4641155_forgesteel]: " PROD_DB
PROD_DB=${PROD_DB:-4641155_forgesteel}

read -p "Production DB User [4641155_forgesteel]: " PROD_USER
PROD_USER=${PROD_USER:-4641155_forgesteel}

read -sp "Production DB Password: " PROD_PASS
echo ""

# Local database credentials
LOCAL_HOST="localhost"
LOCAL_DB="forgesteel"
LOCAL_USER="root"
LOCAL_PASS=""

echo ""
echo "📥 Exporting data from production..."

# Create temporary directory
mkdir -p /tmp/forgesteel-sync

# Export users table (needed for character ownership)
mysqldump -h "$PROD_HOST" -u "$PROD_USER" -p"$PROD_PASS" "$PROD_DB" users \
  --no-create-info \
  --skip-add-locks \
  --skip-disable-keys \
  > /tmp/forgesteel-sync/users.sql

echo "✅ Exported users"

# Export campaigns table
mysqldump -h "$PROD_HOST" -u "$PROD_USER" -p"$PROD_PASS" "$PROD_DB" campaigns campaign_members \
  --no-create-info \
  --skip-add-locks \
  --skip-disable-keys \
  > /tmp/forgesteel-sync/campaigns.sql

echo "✅ Exported campaigns"

# Export characters table
mysqldump -h "$PROD_HOST" -u "$PROD_USER" -p"$PROD_PASS" "$PROD_DB" characters \
  --no-create-info \
  --skip-add-locks \
  --skip-disable-keys \
  --where="is_deleted = 0" \
  > /tmp/forgesteel-sync/characters.sql

echo "✅ Exported characters"

echo ""
echo "📤 Importing data to local database..."

# Import to local database
# Use REPLACE INTO to avoid duplicate key errors

# Import users first (dependencies)
if [ -z "$LOCAL_PASS" ]; then
  mysql -h "$LOCAL_HOST" -u "$LOCAL_USER" "$LOCAL_DB" < /tmp/forgesteel-sync/users.sql
  mysql -h "$LOCAL_HOST" -u "$LOCAL_USER" "$LOCAL_DB" < /tmp/forgesteel-sync/campaigns.sql
  mysql -h "$LOCAL_HOST" -u "$LOCAL_USER" "$LOCAL_DB" < /tmp/forgesteel-sync/characters.sql
else
  mysql -h "$LOCAL_HOST" -u "$LOCAL_USER" -p"$LOCAL_PASS" "$LOCAL_DB" < /tmp/forgesteel-sync/users.sql
  mysql -h "$LOCAL_HOST" -u "$LOCAL_USER" -p"$LOCAL_PASS" "$LOCAL_DB" < /tmp/forgesteel-sync/campaigns.sql
  mysql -h "$LOCAL_HOST" -u "$LOCAL_USER" -p"$LOCAL_PASS" "$LOCAL_DB" < /tmp/forgesteel-sync/characters.sql
fi

echo "✅ Imported users"
echo "✅ Imported campaigns"
echo "✅ Imported characters"

# Cleanup
rm -rf /tmp/forgesteel-sync

echo ""
echo "✅ Sync complete! Your local database now has production data."
echo ""

# Show counts
echo "📊 Data Summary:"
if [ -z "$LOCAL_PASS" ]; then
  mysql -h "$LOCAL_HOST" -u "$LOCAL_USER" "$LOCAL_DB" -e "
    SELECT
      (SELECT COUNT(*) FROM users) as users,
      (SELECT COUNT(*) FROM campaigns) as campaigns,
      (SELECT COUNT(*) FROM characters WHERE is_deleted = 0) as characters;
  "
else
  mysql -h "$LOCAL_HOST" -u "$LOCAL_USER" -p"$LOCAL_PASS" "$LOCAL_DB" -e "
    SELECT
      (SELECT COUNT(*) FROM users) as users,
      (SELECT COUNT(*) FROM campaigns) as campaigns,
      (SELECT COUNT(*) FROM characters WHERE is_deleted = 0) as characters;
  "
fi
