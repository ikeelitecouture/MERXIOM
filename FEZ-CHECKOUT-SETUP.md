# MERXIOM Fez checkout setup

The checkout now uses Fez Delivery only. Delivery is calculated separately for each seller using that seller's saved pickup state and parcel weight. A cart containing products from multiple sellers receives one combined delivery amount and creates one Fez shipment per seller after Paystack confirms payment.

## Required Fez credentials

The existing `FEZ_API_BASE_URL` may be the API root (`https://api.fezdelivery.co/`) or versioned root (`https://api.fezdelivery.co/v1`). The adapter normalizes either to `/v1`.

Add the following to `backend/.env` (do not share these values):

```env
FEZ_API_BASE_URL=https://api.fezdelivery.co/v1
FEZ_USER_ID=your-fez-user-id
FEZ_PASSWORD=your-fez-password
FEZ_API_KEY=your-fez-secret-key
```

`FEZ_SECRET_KEY` may be used instead of `FEZ_API_KEY`. Fez authentication uses `FEZ_USER_ID` and `FEZ_PASSWORD`; the authenticated response's `orgDetails.secret-key` is preferred, with the configured secret key as fallback. The API key by itself is not sufficient to log in.

## Seller pickup addresses

Each seller signs in and opens **Seller dashboard → Pickup address**. They must save a real contact name, phone number, street address, city and state. These details are used as the third-party sender/pickup address when Fez books that seller's parcel. There is no global MERXIOM or Obana pickup-address fallback.

## Checkout lifecycle

1. Buyer enters a delivery destination and requests a Fez quote.
2. The API groups cart items by seller and obtains a Fez state-to-state rate for each seller's pickup state and grouped parcel weight.
3. The server signs the short-lived quote and verifies it again before creating the order. The order endpoint now returns the created order to the frontend.
4. Paystack initializes payment for the verified subtotal plus combined delivery fee.
5. Only after Paystack server verification or a valid webhook does the server mark the order paid, decrement stock and create each seller's Fez shipment.
6. Each returned Fez order number is stored separately in `order.shipments` and can be refreshed through the tracking endpoint.

## Important verification note

The uploaded project did not contain `FEZ_USER_ID` or `FEZ_PASSWORD`, so live Fez authentication, live rates, actual shipment booking and real Paystack checkout cannot be exercised from this package without those credentials and a running MongoDB/Paystack environment. The existing `FEZ_API_KEY` and base URL were preserved. Never paste API credentials into chat.
