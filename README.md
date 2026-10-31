# MERXIOM Rebuilt Workspace

A navy-and-white Nigerian marketplace foundation with database-backed products, buyer/seller/admin flows, email verification, Paystack payments, Obana Logistics quotes/shipments, MERXIOM AI integration, and bulk RFQ management.

## Important integration truth
- This archive contains **no live credentials**. Never place secrets in frontend code or commit `.env`.
- `scripts/import-axiom-env.sh` copies the existing `~/axiom/backend/.env` into this separate workspace, preserving the original project. It adds missing integration settings without printing secret values.
- Live Paystack processing requires your Paystack **live** secret key and a public HTTPS webhook URL configured in Paystack Dashboard.
- Obana Logistics integration uses its documented API. Create a store key at https://logistics.obana.africa/docs and set `OBANA_STORE_KEY`; quotes can be requested without a key, but shipment booking requires a store key and valid pickup/delivery details.
- Cloudinary credentials are required for direct product photo uploads; sellers can alternatively supply a hosted image URL. SMTP must be configured to send real email verification codes. AI requires your own provider key and model settings. The app returns a configuration error rather than pretending those integrations succeeded.
- This is a deployable source workspace, not a claim that your external provider accounts, DNS, SMTP sender domain, production database, live keys, webhook URLs, or store pickup address have already been configured. Those require your accounts and production environment.

## Stack
- Frontend: React, TypeScript, Vite, React Router, navy/white responsive design.
- Backend: Node.js, Express, MongoDB/Mongoose, JWT auth, role-based authorization, Nodemailer, Paystack REST API, Obana Logistics API, OpenAI-compatible AI API.

## Quick start (Termux)
1. Extract the ZIP, then enter `MERXIOM-REBUILT-WORKSPACE`.
2. Run `bash scripts/import-axiom-env.sh` to import the AXIOM backend env into this new workspace. The original `~/axiom` is not modified.
3. Edit `backend/.env` locally and fill missing values, especially `ADMIN_EMAILS`, SMTP, Paystack live credentials, AI provider credentials, Obana store key, and pickup address. Do not send secrets to anyone.
4. Install dependencies:
   ```sh
   cd backend && npm install
   cd ../frontend && npm install
   ```
5. Start backend in one Termux session: `cd backend && npm run dev`
6. Start frontend in another: `cd frontend && npm run dev -- --host 0.0.0.0`
7. Open the Vite URL shown in Termux (default port 4500).

## Environment and first admin
- `ADMIN_EMAILS` is a comma-separated allowlist. Only an account whose verified email matches this list receives admin role at registration/login. Also protect admin routes on the server.
- Set `OWNER_EMAIL` to identify the MERXIOM owner account/store. Owner products remain part of the same marketplace feed; the interface does not add an unnecessary owner badge.
- The initial categories are seeded as configurable database records with `npm run seed:categories`; no demo products or fake transactions are inserted.

## Production deployment checklist
1. Use a managed MongoDB database with backups and restricted network access.
2. Set `NODE_ENV=production`, strong random `JWT_SECRET`, CORS/WEB_URL and HTTPS URLs.
3. Configure Cloudinary image storage, SMTP sender, Paystack live keys and `PAYSTACK_WEBHOOK_SECRET` (Paystack secret key is used to verify `x-paystack-signature` HMAC SHA-512 webhooks).
4. Configure Obana store key, webhook signing secret and public webhook URL (`/api/commerce/webhooks/obana`); test quote, paid-order shipment booking, signature verification and tracking against the real account.
5. Configure an AI provider endpoint, model and API key on the server only.
6. Configure `ADMIN_EMAILS`, verify admin mailboxes, then register accounts using those addresses. Do not promote users via frontend state.
7. Run `npm test` in backend and `npm run build` in frontend before deployment.

## Notes
- Products, categories, orders, RFQs and chat history are persisted in MongoDB.
- The frontend contains no seeded product catalogue; empty states are shown until products are created.
- Paystack order status changes only after server-side transaction verification or a verified webhook.
- Obana shipment creation is attempted only after a paid order and only when a valid store key and pickup details are configured.
- The AI endpoint is instructed to answer MERXIOM website/product/order-policy questions using database-backed context and cannot access secrets.


## Courier provider adapters

Checkout compares live quotes from enabled providers and revalidates the selected quote before order creation.

- **Obana Logistics:** uses the existing Obana quote, shipment and tracking adapter. Set the Obana store key and pickup details for booking.
- **Chowdeck Relay:** uses the documented native Relay API flow: fee quote, delivery creation with the returned `fee_id`, and tracking. Set `CHOWDECK_RELAY_API_KEY`; the default API base is `https://api.relay.chowdeck.com/relay`. Chowdeck expects an address string or coordinates, so MERXIOM sends the configured pickup address and the buyer's entered delivery address. Confirm your merchant access and sandbox/live credentials before launch.
- **Gokada and Fez:** provider slots are present, but the current implementation uses a configurable MERXIOM API-compatible gateway contract because their exact account-specific API endpoints, auth requirements and payloads have not been confirmed for this workspace. Configure `GOKADA_API_BASE_URL` / `GOKADA_API_KEY` and `FEZ_API_BASE_URL` / `FEZ_API_KEY` only when you have an API endpoint or gateway that supports this contract. It uses `POST /quotes`, `POST /shipments`, and `GET /shipments/:reference`.

For Gokada or Fez, if your official merchant API uses a different authentication scheme or payload, implement the provider-specific mapping in `backend/src/services/couriers/index.js` from the current official documentation before enabling it. Do not treat a generic adapter slot as a verified native carrier integration. All provider keys must remain server-side. Reference docs: [Chowdeck Relay API](https://chowdeck-api.readme.io/docs/creating-a-delivery), [Fez Business API](https://fez-delivery-co.gitbook.io/fezcorporate-api-docs), and [Gokada Business](https://www.gokada.ng/business).

## Checkout and payment notes

Paystack initialization and verification are server-side. The callback and signed webhook verify the reference, NGN currency, and expected amount. The paid transition is guarded atomically so concurrent callback/webhook deliveries do not intentionally decrement inventory twice. Inventory reconciliation still requires operational monitoring for cases where stock changes between checkout and payment; consider inventory reservation/expiry before a high-volume launch.

## Environment and launch verification

Do not commit `.env` files or production keys. Configure `PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET` (if using signed webhook verification with a separate secret), `OBANA_STORE_KEY`, `OBANA_WEBHOOK_SECRET`, pickup address fields, MongoDB, email and AI credentials in the deployment environment. Run `npm ci` in `backend` and `frontend`, `npm test` in `backend`, and `npm run build` in `frontend`. Live payment, courier, email, AI-provider, and deployment checks require valid provider credentials and registered webhook URLs.
