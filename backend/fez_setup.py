from pathlib import Path
from getpass import getpass
import os
import re

env_file = Path(".env")

if not env_file.exists():
    print("ERROR: .env file not found.")
    raise SystemExit(1)

print("\n===== MERXIOM FEZ CONFIGURATION =====")

email = input("Fez registered email: ").strip()
password = getpass("Fez portal password (hidden): ").strip()
api_key = getpass("Updated Fez API key (hidden): ").strip()

if not email or not password or not api_key:
    print("ERROR: All fields are required. Nothing saved.")
    raise SystemExit(1)

values = {
    "FEZ_USER_ID": email,
    "FEZ_PASSWORD": password,
    "FEZ_API_KEY": api_key,
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

print("\nSUCCESS: Fez configuration saved.")
print("Email: SAVED")
print("Password: SAVED (hidden)")
print("API key: SAVED (hidden)")
print("Production URL: SAVED")
