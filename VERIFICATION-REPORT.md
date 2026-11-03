# MERXIOM verification report

This report applies to the uploaded source archive after the checkout repair.

## Changes
- Checkout sends the complete delivery address when requesting rates.
- Cart/address edits invalidate previous quotes.
- Quote tokens are HMAC-signed and bound to the authenticated user, cart and normalized destination; they expire after ten minutes.
- Order creation revalidates seller groups, prices, weights and iClose quote details.
- Fez Delivery and iClose are the only active checkout courier providers.
- Tracking events store their actual provider.
- iClose state mapping only assumes Lagos → `ng-la`, based on the supplied documentation.
- `.env` and `.env` backup files are excluded from the repaired ZIP.

## Not claimed as live-tested
- Paystack live charges/webhooks.
- Fez or iClose live quotes, bookings, tracking or cancellation.
- MongoDB production persistence, SMTP delivery, Cloudinary uploads or external AI calls.

Run `npm test` in `backend` and `npm run build` in `frontend` on the target Termux installation. Live provider checks must use the user's own private credentials.
