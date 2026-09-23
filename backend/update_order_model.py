from pathlib import Path

p = Path("models/Order.js")
s = p.read_text()

old = '''    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },'''

new = '''    subtotal: { type: Number, required: true, min: 0 },

    platformFee: {
      type: Number,
      default: 0,
      min: 0
    },

    sellerAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    deliveryFee: {
      type: Number,
      default: 0,
      min: 0
    },'''

if old not in s:
    raise SystemExit("Target fields not found.")

p.write_text(s.replace(old, new, 1))
print("Order commission fields added successfully.")
