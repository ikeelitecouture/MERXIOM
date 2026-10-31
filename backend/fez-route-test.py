import json
import urllib.request
from pathlib import Path

env = {}
for line in Path(".env").read_text().splitlines():
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")

pickup = input("Seller pickup state: ").strip()
destination = input("Buyer delivery state: ").strip()
weight = input("Package weight in kg [1]: ").strip() or "1"

if not pickup or not destination:
    raise SystemExit("Both states are required.")

base = env["FEZ_API_BASE_URL"].rstrip("/")
def post(path, payload, headers=None):
    req = urllib.request.Request(
        base + path,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", **(headers or {})},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())

try:
    print("\nAuthenticating...")
    auth = post("/user/authenticate", {
        "user_id": env["FEZ_USER_ID"],
        "password": env["FEZ_PASSWORD"]
    })
    token = auth["authDetails"]["authToken"]
    secret = auth["orgDetails"]["secret-key"]

    print("Authentication successful.")
    print(f"Requesting {pickup} to {destination} quote...")

    result = post("/order/cost", {
        "state": destination,
        "pickUpState": pickup,
        "weight": max(1, int(float(weight) + 0.999999))
    }, {
        "Authorization": "Bearer " + token,
        "secret-key": secret
    })

    print("\nFEZ ROUTE QUOTE")
    print(json.dumps(result, indent=2))
    print("\nNo shipment was booked.")
except Exception as e:
    print("\nQUOTE TEST FAILED:", type(e).__name__, str(e)[:500])
