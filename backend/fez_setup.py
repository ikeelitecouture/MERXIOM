from pathlib import Path
from getpass import getpass
import os
import re

env_file = Path(".env")
if not env_file.exists():
    print("ERROR: .env not found. Create it from .env.example first.")
    raise SystemExit(1)

print("\n===== MERXIOM FEZ CONFIGURATION =====")
user_id = input("Fez registered user ID/email: ").strip()
password = getpass("Fez account password (hidden): ").strip()
if not user_id or not password:
    print("ERROR: Both fields are required. Nothing saved.")
    raise SystemExit(1)

values = {
    "FEZ_USER_ID": user_id,
    "FEZ_PASSWORD": password,
    "FEZ_API_BASE_URL": "https://api.fezdelivery.co/v1"
}
content = env_file.read_text()
for name, value in values.items():
    pattern = rf"(?m)^{re.escape(name)}=.*$"
    line = f"{name}={value}"
    if re.search(pattern, content):
        content = re.sub(pattern, lambda _: line, content)
    else:
        content += ("" if content.endswith("\n") else "\n") + line + "\n"

temp = Path(".env.fez.tmp")
temp.write_text(content)
os.chmod(temp, 0o600)
temp.replace(env_file)
os.chmod(env_file, 0o600)
print("\nSUCCESS: Fez account credentials saved privately in .env.")
print("Restart the MERXIOM backend to load them.")
