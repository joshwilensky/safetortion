#!/usr/bin/env bash
set -euo pipefail

: "${MAXMIND_ACCOUNT_ID:?ERROR: set MAXMIND_ACCOUNT_ID}"
: "${MAXMIND_LICENSE_KEY:?ERROR: set MAXMIND_LICENSE_KEY}"

DB_NAME="GeoLite2-City"
PERMALINK="https://download.maxmind.com/geoip/databases/${DB_NAME}/download?suffix=tar.gz"

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd -P)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd -P)"

# Prefer /data (cloud persistent disk); else local geo-db
if [[ -d "/data" ]]; then DB_DIR="/data"; else DB_DIR="${PROJECT_ROOT}/geo-db"; fi
mkdir -p "$DB_DIR"

TMP_DIR="$(mktemp -d)"
TARBALL="${TMP_DIR}/${DB_NAME}.tar.gz"
DB_PATH="${DB_DIR}/${DB_NAME}.mmdb"

echo "[1/3] Downloading ${DB_NAME} (to ${TARBALL}) ..."
curl -fsSL -u "${MAXMIND_ACCOUNT_ID}:${MAXMIND_LICENSE_KEY}" \
  -o "${TARBALL}" "${PERMALINK}"

echo "[2/3] Extracting mmdb ..."
tar -xzf "${TARBALL}" -C "${TMP_DIR}"
FOUND="$(find "${TMP_DIR}" -type f -name "${DB_NAME}.mmdb" | head -n 1 || true)"
if [[ -z "${FOUND}" ]]; then
  echo "ERROR: ${DB_NAME}.mmdb not found in archive" >&2
  exit 1
fi

mv -f "${FOUND}" "${DB_PATH}"
echo "[3/3] Installed: ${DB_PATH}"

# Local convenience: update .env only when not using /data and .env is writable
if [[ "${DB_DIR}" != "/data" && -w "${PROJECT_ROOT}/.env" ]]; then
  echo "[local] Updating .env with GEO_MAXMIND_DB_PATH=${DB_PATH}"
  grep -v '^GEO_MAXMIND_DB_PATH=' "${PROJECT_ROOT}/.env" 2>/dev/null > "${PROJECT_ROOT}/.env.tmp" || true
  echo "GEO_MAXMIND_DB_PATH=${DB_PATH}" >> "${PROJECT_ROOT}/.env.tmp"
  mv "${PROJECT_ROOT}/.env.tmp" "${PROJECT_ROOT}/.env"
fi

rm -rf "${TMP_DIR}"
echo "✅ Done"
