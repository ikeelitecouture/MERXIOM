# MERXIOM checkout repair report

## Source changes in this repair pass
- Checkout quote requests now send the complete delivery form, including street address, rather than only city/state/country.
- Address edits and cart changes invalidate previously displayed delivery quotes.
- Checkout requires a selected, unexpired quote before creating an order.
- Signed quote tokens are bound to the authenticated buyer, cart quantities/product IDs, and normalized full delivery address; they expire after 10 minutes.
- Order creation revalidates the selected provider's current quote, seller groups, prices and weights. iClose distance/state/rate type are also compared.
- The active courier registry exposes Fez Delivery and iClose only. Chowdeck Relay and Gokada are not registered. Obana legacy source remains retained but is not an active checkout option.
- iClose state-name mapping is limited to Lagos (`ng-la`) because that is the only named state mapping established by the supplied documentation. Other states require an explicitly confirmed `ng-xx` code.
- Tracking events now retain the shipment's actual provider instead of being labelled as Fez by default.
- Added iClose environment settings to `backend/.env.example`.

## Validation scope
- Static JavaScript syntax checks and focused backend tests are run before packaging.
- The ZIP intentionally excludes all `.env` files and `.env` backup variants.
- Live MongoDB, Paystack, Fez, iClose and SMTP transactions require the user's private credentials and must be tested from their Termux environment. No live booking or payment is claimed by this report.
