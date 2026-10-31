#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/backend/.env"
if [ ! -f "$ENV_FILE" ]; then echo "backend/.env was not found; create it from backend/.env.example first."; exit 1; fi
read -r -p "Fez User ID: " FEZ_USER_ID
read -r -s -p "Fez Password (hidden): " FEZ_PASSWORD
echo
if [ -z "$FEZ_USER_ID" ] || [ -z "$FEZ_PASSWORD" ]; then echo "Both values are required. Nothing changed."; exit 1; fi
FEZ_USER_ID="$FEZ_USER_ID" FEZ_PASSWORD="$FEZ_PASSWORD" ENV_FILE="$ENV_FILE" node <<'NODE'
const fs = require('node:fs');
const file = process.env.ENV_FILE;
let text = fs.readFileSync(file, 'utf8');
for (const key of ['FEZ_USER_ID', 'FEZ_PASSWORD']) {
  const value = JSON.stringify(process.env[key] || '');
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(text)) text = text.replace(re, line);
  else text += `${text.endsWith('\n') ? '' : '\n'}${line}\n`;
}
fs.writeFileSync(file, text, { mode: 0o600 });
NODE
echo "Fez login credentials saved privately in backend/.env. Existing settings were preserved."
echo "Restart the MERXIOM backend to load them."
