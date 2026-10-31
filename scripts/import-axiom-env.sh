#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="${AXIOM_ENV_PATH:-$HOME/axiom/backend/.env}"
TARGET="$ROOT/backend/.env"
if [[ ! -f "$SOURCE" ]]; then
  echo "AXIOM env file not found at: $SOURCE"
  echo "If your file is elsewhere, run: AXIOM_ENV_PATH=/path/to/backend/.env bash scripts/import-axiom-env.sh"
  echo "No files were changed."
  exit 1
fi
if [[ -e "$TARGET" ]]; then
  echo "Target backend/.env already exists; refusing to overwrite it."
  echo "Inspect it and merge settings manually if needed."
  exit 1
fi
cp "$SOURCE" "$TARGET"
chmod 600 "$TARGET"
# Append missing variables only; existing values are preserved and never printed.
append_if_missing() {
  local key="$1" value="$2"
  if ! grep -qE "^[[:space:]]*${key}=" "$TARGET"; then printf '\n%s=%s\n' "$key" "$value" >> "$TARGET"; fi
}
append_if_missing NODE_ENV development
append_if_missing PORT 5000
append_if_missing WEB_URL http://localhost:4500
append_if_missing CORS_ORIGIN http://localhost:4500
append_if_missing JWT_SECRET "CHANGE_ME_TO_A_LONG_RANDOM_SECRET"
append_if_missing ADMIN_EMAILS ""
append_if_missing OWNER_EMAIL ""
append_if_missing SMTP_HOST ""
append_if_missing SMTP_PORT 587
append_if_missing SMTP_SECURE false
append_if_missing SMTP_USER ""
append_if_missing SMTP_PASS ""
append_if_missing SMTP_FROM "MERXIOM <no-reply@example.com>"
append_if_missing PAYSTACK_SECRET_KEY ""
append_if_missing PAYSTACK_WEBHOOK_SECRET ""
append_if_missing OBANA_BASE_URL "https://obana-logistics-t6qg.onrender.com"
append_if_missing OBANA_STORE_KEY ""
append_if_missing OBANA_WEBHOOK_SECRET ""
append_if_missing OBANA_PICKUP_NAME ""
append_if_missing OBANA_PICKUP_PHONE ""
append_if_missing OBANA_PICKUP_LINE1 ""
append_if_missing OBANA_PICKUP_CITY ""
append_if_missing OBANA_PICKUP_STATE ""
append_if_missing AI_BASE_URL "https://api.openai.com/v1"
append_if_missing AI_API_KEY ""
append_if_missing AI_MODEL "gpt-4o-mini"
append_if_missing AI_SYSTEM_PROMPT "You are MERXIOM AI, a helpful assistant for the MERXIOM marketplace. Answer using supplied product and policy context; do not invent inventory, prices, order statuses, payments, or delivery details."
append_if_missing SUPPORT_EMAIL ""
append_if_missing CLOUDINARY_CLOUD_NAME ""
append_if_missing CLOUDINARY_API_KEY ""
append_if_missing CLOUDINARY_API_SECRET ""
append_if_missing UPLOAD_MAX_MB 8
append_if_missing RATE_LIMIT_WINDOW_MS 900000
append_if_missing RATE_LIMIT_MAX 150
cat <<'MSG'
Imported AXIOM backend env into the new MERXIOM workspace without changing the source.
Secret values were not printed. Review backend/.env locally and fill blank integration settings.
IMPORTANT: replace placeholder JWT_SECRET before deployment; configure provider live keys only on your server.
MSG
