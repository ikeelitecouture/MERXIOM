# MERXIOM build status

## Included
- Responsive navy/white marketplace frontend and database-backed product/category pages.
- Buyer, seller and admin account flows, email verification and role-aware routing.
- Seller product management, inventory display, support/RFQ flows and MERXIOM AI integration.
- Server-side Paystack initialization, transaction verification and signed webhook handling.
- Active checkout courier choices limited to Fez Delivery and iClose.
- Per-seller shipment grouping for multi-vendor carts, shipment booking after verified payment, and tracking routes.
- Seller pickup-address management.
- Signed 10-minute delivery quotes bound to the buyer, cart and full delivery address, with server-side rate revalidation.

## Repair changes in this archive
- Full street address is now included in the frontend delivery quote request.
- Editing the address or cart clears the previous quote; checkout requires a selected, unexpired quote.
- Quote-token validation checks the buyer identity and a fingerprint of cart and delivery address.
- iClose state mapping is limited to Lagos (`ng-la`) unless a different exact code is explicitly supplied and confirmed.
- Tracking event records preserve the actual courier provider.
- Obana source is retained but not offered at checkout. Chowdeck Relay and Gokada are not active.

## Validation
The repair report records the exact automated checks performed during this pass. Live payment, courier booking/tracking/cancellation, SMTP and production database operations require the user's private provider credentials and cannot be claimed as tested from this source archive.
