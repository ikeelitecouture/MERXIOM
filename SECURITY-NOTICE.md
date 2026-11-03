# Security notice

This source archive contains no `.env` files or `.env` backup files. Keep the real `backend/.env` only on your own device or in your private deployment secret store.

The earlier uploaded repair archive included historical `.env` backups. Treat credentials stored in those backups as exposed: rotate/revoke the Paystack secret key, MongoDB credentials/URI, JWT secret, AI provider keys, Cloudinary keys, email/API keys and any other non-empty credentials found there. Then update your private local `backend/.env`. Do not upload those backups again.

The repair ZIP contains source and `.env.example` templates only. Live payment and courier operations still require your private provider accounts and credentials.
