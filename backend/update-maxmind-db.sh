#!/usr/bin/env bash
set -e

# ===== CONFIG =====
LICENSE_KEY="${MAXMIND_LICENSE_KEY}"
TARGET_DIR="$(pwd)/geo-db"
DB_NAME="GeoLite2-City"

if [ -z "$LICENSE_KEY" ]; then
  echo "ERROR: Please set MAXMIND_LICENSE_KEY in your environment first."
  echo "Get one from https://www.maxmind.com/en/accounts/current/license-key"
  exit 1
fi

mkdir -p "$TARGET_DIR"

echo "[1/3] Downloading MaxMind $DB_NAME..."
curl -s -L "https://download.maxmind.com/app/geoip_download?edition_id=${DB_NAME}&license_key=${LICENSE_KEY}&suffix=tar.gz" \
  -o "$TARGET_DIR/${DB_NAME}.tar.gz"

echo "[2/3] Extracting .mmdb..."
tar -xzf "$TARGET_DIR/${DB_NAME}.tar.gz" -C "$TARGET_DIR" --strip-components=1 --wildcards "*/${DB_NAME}.mmdb"

ABS_PATH="$(cd "$TARGET_DIR" && pwd)/${DB_NAME}.mmdb"

echo "[3/3] Updating .env with GEO_MAXMIND_DB_PATH..."
# Remove old line, then add new
grep -v '^GEO_MAXMIND_DB_PATH=' .env 2>/dev/null > .env.tmp || true
echo "GEO_MAXMIND_DB_PATH=${ABS_PATH}" >> .env.tmp
mv .env.tmp .env

echo "✅ Done! MaxMind DB ready at: $ABS_PATH"
echo "Your .env now has: GEO_MAXMIND_DB_PATH=${ABS_PATH}"
