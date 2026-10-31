# MERXIOM workspace verification report

## Changes made
- Added a courier registry and normalized provider-qualified quote IDs.
- Added a native Chowdeck Relay adapter using the documented fee quote, delivery creation, and tracking endpoints.
- Retained the existing Obana integration and added optional API-compatible gateway adapters for Gokada and Fez.
- Added an authenticated order-tracking refresh endpoint and connected it to the order history page.
- Made Paystack paid-state reconciliation atomic so concurrent callback/webhook handling cannot both claim the same unpaid order.
- Added owner-scoped private AI memory notes, save/delete endpoints, and AI-page controls. Answers influenced by private memory bypass shared answer caching.
- Prevented first-person/ownership prompts from entering the shared reusable-answer cache.
- Updated environment examples, deployment blueprint, README and build status.

## Checks completed
- `node --check` passed for all 22 backend JavaScript source/test files.
- TypeScript parser reported zero syntax diagnostics for `frontend/src/App.tsx`, `frontend/src/lib/api.ts`, and `frontend/src/main.tsx`.
- `render.yaml` parsed successfully.
- Project package manifests and lockfiles parsed as valid JSON.
- `npm test`: 3 passed, 0 failed, 1 skipped. The model smoke test is skipped only because `mongoose` could not be installed in this execution environment.
- ZIP integrity will be checked after packaging.
- No real `.env` files or API secrets are included in this archive.

## Still requires installation or live credentials
- The full frontend production build was not verified because dependency installation timed out in this environment.
- The Mongoose-backed model test needs `npm ci` and must be rerun on the target device.
- Paystack live payment/webhook, MongoDB persistence, SMTP, Cloudinary and AI provider calls were not exercised with production credentials.
- Obana booking/webhook requires configured pickup details and a store key.
- Chowdeck Relay requires an API key and merchant access. Its address-string quote path is implemented from the public Relay docs, but live API behavior has not been tested.
- Gokada and Fez currently have configurable API-compatible gateway adapters, not verified native integrations. Their official merchant API endpoint/auth/payload details must be confirmed and mapped before enabling them.

## Suggested post-extraction checks
1. Preserve and import the existing backend `.env` locally using `scripts/import-axiom-env.sh`; do not share or upload it.
2. Run `npm ci` in `backend` and `frontend`.
3. Run `npm test` in `backend` and `npm run build` in `frontend`.
4. Configure provider credentials only in the backend/deployment secret store.
5. Test with Paystack sandbox and each courier's sandbox before production traffic.
