# MERXIOM Rebuilt Workspace

A navy-and-white Nigerian marketplace foundation with database-backed products, buyer/seller/admin flows, email verification, Paystack payments, Fez Delivery and iClose quotes/shipments, MERXIOM AI integration, and bulk RFQ management.

## Important integration truth
- This archive contains **no live credentials**. Never place secrets in frontend code or commit `.env`.
- `scripts/import-axiom-env.sh` copies the existing `~/axiom/backend/.env` into this separate workspace, preserving the original project. It adds missing integration settings without printing secret values.
- Live Paystack processing requires your Paystack **live** secret key and a public HTTPS webhook URL configured in Paystack Dashboard.
- Obana adapter files and environment variables are retained for migration/reference only; Obana is not offered as an active checkout courier.
- Cloudinary credentials are required for direct product photo uploads; sellers can alternatively supply a hosted image URL. SMTP must be configured to send real email verification codes. AI requires your own provider key and model settings. The app returns a configuration error rather than pretending those integrations succeeded.
- This is a deployable source workspace, not a claim that your external provider accounts, DNS, SMTP sender domain, production database, live keys, webhook URLs, or store pickup address have already been configured. Those require your accounts and production environment.

## Stack
- Frontend: React, TypeScript, Vite, React Router, navy/white responsive design.
- Backend: Node.js, Express, MongoDB/Mongoose, JWT auth, role-based authorization, Nodemailer, Paystack REST API, Fez Delivery and iClose APIs, OpenAI-compatible AI API.

## Quick start (Termux)
1. Extract the ZIP, then enter `MERXIOM-REBUILT-WORKSPACE`.
2. Run `bash scripts/import-axiom-env.sh` to import the AXIOM backend env into this new workspace. The original `~/axiom` is not modified.
3. Edit `backend/.env` locally and fill missing values, especially `ADMIN_EMAILS`, SMTP, Paystack live credentials, AI provider credentials, Fez and iClose credentials, and pickup address. Do not send secrets to anyone.
4. Install dependencies:
   ```sh
   cd backend && npm install
   cd ../frontend && npm install
   ```
5. Start backend in one Termux session: `cd backend && npm run dev`
6. Start frontend in another: `cd frontend && npm run dev -- --host 0.0.0.0`
7. Open the Vite URL shown in Termux (default port 2445).

## Environment and first admin
- `ADMIN_EMAILS` is a comma-separated allowlist. Only an account whose verified email matches this list receives admin role at registration/login. Also protect admin routes on the server.
- Set `OWNER_EMAIL` to identify the MERXIOM owner account/store. Owner products remain part of the same marketplace feed; the interface does not add an unnecessary owner badge.
- The initial categories are seeded as configurable database records with `npm run seed:categories`; no demo products or fake transactions are inserted.

## Production deployment checklist
1. Use a managed MongoDB database with backups and restricted network access.
2. Set `NODE_ENV=production`, strong random `JWT_SECRET`, CORS/WEB_URL and HTTPS URLs.
3. Configure Cloudinary image storage, SMTP sender, Paystack live keys and `PAYSTACK_WEBHOOK_SECRET` (Paystack secret key is used to verify `x-paystack-signature` HMAC SHA-512 webhooks).
4. Configure Fez and iClose credentials and seller pickup addresses; test quote, paid-order shipment booking, tracking and iClose cancellation against the real accounts. The legacy Obana webhook middleware is retained but is not part of active checkout.
5. Configure an AI provider endpoint, model and API key on the server only.
6. Configure `ADMIN_EMAILS`, verify admin mailboxes, then register accounts using those addresses. Do not promote users via frontend state.
7. Run `npm test` in backend and `npm run build` in frontend before deployment.

## Notes
- Products, categories, orders, RFQs and chat history are persisted in MongoDB.
- The frontend contains no seeded product catalogue; empty states are shown until products are created.
- Paystack order status changes only after server-side transaction verification or a verified webhook.
- Fez and iClose shipment creation is attempted only after a paid order and only when the provider credentials and seller pickup details are valid.
- The AI endpoint is instructed to answer MERXIOM website/product/order-policy questions using database-backed context and cannot access secrets.


## Active checkout couriers

Checkout currently exposes **Fez Delivery** and **iClose** only.

- **Fez Delivery:** native account authentication and quote, booking and tracking calls. Configure `FEZ_API_BASE_URL`, `FEZ_USER_ID`, `FEZ_PASSWORD`, and (only if supplied by Fez for your account) `FEZ_SECRET_KEY`.
- **iClose:** native documented API calls using `X-API-Key` at `https://iclose.com.ng/api/v1`. Configure `ICLOSE_API_KEY` and optionally `ICLOSE_API_BASE_URL`. The integration uses `/distance`, `/delivery-fees`, `/orders`, `/track/:code`, and `/orders/:id/cancel`.
- The only state-name mapping currently asserted by the supplied iClose documentation is Lagos → `ng-la`. For other states, provide an exact `ng-xx` code confirmed by iClose or request confirmation from iClose; MERXIOM deliberately does not guess state codes.
- Each seller's saved pickup address creates a separate shipment group. The buyer sees a combined delivery price, while paid-order booking is performed per seller.
- Obana source and historical integration files are retained for migration/reference but are not offered as active checkout options. Chowdeck Relay and Gokada are not active.

All courier credentials remain server-side in `backend/.env` or the deployment secret store. Never add them to frontend environment variables or upload `.env` backups.

## Checkout and payment notes

Paystack initialization and verification are server-side. The callback and signed webhook verify the reference, NGN currency, and expected amount. The paid transition is guarded atomically so concurrent callback/webhook deliveries do not intentionally decrement inventory twice. Inventory reconciliation still requires operational monitoring for cases where stock changes between checkout and payment; consider inventory reservation/expiry before a high-volume launch.

## Environment and launch verification

Do not commit `.env` files or production keys. Configure `PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET` (if using signed webhook verification with a separate secret), Fez/iClose credentials, seller pickup address fields, MongoDB, email and AI credentials in the deployment environment. Run `npm ci` in `backend` and `frontend`, `npm test` in `backend`, and `npm run build` in `frontend`. Live payment, courier, email, AI-provider, and deployment checks require valid provider credentials and registered webhook URLs.
