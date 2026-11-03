# MERXIOM Fez + iClose courier implementation

This update keeps the existing MERXIOM application and Paystack integration. The active courier registry exposes Fez and iClose only; the older Obana, Chowdeck Relay and Gokada source files are retained but are not selectable.

## Included changes
- Added `backend/src/services/iclose.js` using the documented `X-API-Key` header and iClose distance, delivery-fee, booking, tracking and cancellation endpoints.
- Updated the courier registry to expose Fez and iClose only.
- Extended shipment records with provider reference, iClose tracking code and saved quote data.
- Updated `/commerce/shipping/quote` to return successful quotes from both configured couriers.
- Updated order creation to validate the selected provider's signed quote again and persist the chosen provider and per-seller quote data.
- Updated post-Paystack-confirmation shipment booking to dispatch to the selected courier per seller shipment.
- Updated authenticated and public tracking to dispatch by shipment provider; public tracking accepts the iClose tracking code.
- Added an authenticated iClose shipment cancellation endpoint: `POST /commerce/orders/:id/shipments/:shipmentId/cancel`. It only attempts cancellation when local status is exactly `booked`, and marks cancelled only after the provider request succeeds.
- Updated checkout to send the complete destination address when requesting quotes.

## Configuration
Keep the existing secrets in `backend/.env`; this ZIP deliberately does not contain `.env` files.

Required existing variables:
- `FEZ_USER_ID`
- `FEZ_PASSWORD`
- `ICLOSE_API_KEY`
- `JWT_SECRET`
- Existing Paystack variables

Add:
`ICLOSE_BASE_URL=https://iclose.com.ng/api/v1`

The iClose adapter currently has confirmed state-code mappings for Lagos, Ogun, Ondo, Oyo, Osun, Ekiti and Abuja/FCT only. Other state codes are deliberately rejected until confirmed against iClose documentation/account support. The API's exact JSON response field names should be checked against a real sandbox/test quote before production rollout; no live booking has been performed as part of this source update.

## Deploy in Termux
1. Back up the current project folder.
2. Extract this ZIP into a new folder, then copy your existing `backend/.env` into the extracted backend folder. Do not overwrite your original `.env`.
3. Install dependencies if needed: `cd backend && npm install` and `cd ../frontend && npm install`.
4. Run backend tests: `cd backend && npm test`.
5. Start the backend and test quotes with a low-risk test address before accepting customer payments.

The ZIP does not include node_modules, build output, Git history or credentials. Existing Paystack code and Fez service are preserved.
