# Environment reference

All `.env` files, including examples and backups, are intentionally ignored by Git for this project. Create `backend/.env` locally or configure the same variables in the hosting provider. Never copy credentials between client stores.

## Required production values

```text
NODE_ENV=production
STRICT_PRODUCTION_CONFIG=true
MONGO_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
CLIENT_ORIGINS=https://your-frontend.example
FRONTEND_URL=https://your-frontend.example
REQUIRE_DATABASE=true
REQUIRE_MEDIA_STORAGE=true
AUTH_COOKIE_SAME_SITE=none
AUTH_COOKIE_SECURE=true
ALLOW_REFRESH_TOKEN_BODY=false
RETURN_REFRESH_TOKEN_IN_BODY=false
```

Provide either all `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` values or all `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` values.

## Current team demo login

```text
OTP_MODE=demo
DEMO_OTP=123456
ALLOW_HOSTED_OWNER_DEMO=true
ADMIN_PHONE_NUMBERS=
```

For public login, use `OTP_MODE=production`, configure `SMS_PROVIDER` and its server-side credentials, then set `ALLOW_HOSTED_OWNER_DEMO=false`.

## Optional services

- Payments: `PAYMENTS_ENABLED`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- Reel queue: `REDIS_URL`, `REQUIRE_REDIS`, `AI_VIDEO_WORKER_URL`, `AI_VIDEO_WORKER_SERVICE_TOKEN`
- Smart product details: `GEMINI_API_KEY`, `GEMINI_MODEL`
- Email: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`
- Courier providers: use the Blue Dart, Delhivery, Shiprocket, or Xpressbees keys documented in `backend/SHIPPING.md`
- Managed clients: `CONTROL_PLANE_URL`, `CLIENT_INSTALLATION_ID`, `CLIENT_LICENSE_KEY`, `LICENSE_SIGNING_PUBLIC_KEY`

## Social Studio

Facebook Login with connected Pages uses `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI` and `META_WEBHOOK_VERIFY_TOKEN`. Direct professional Instagram Login uses `INSTAGRAM_BUSINESS_APP_ID`, `INSTAGRAM_BUSINESS_APP_SECRET`, `INSTAGRAM_BUSINESS_REDIRECT_URI` and the same webhook verify token. `META_GRAPH_VERSION` selects the server-side Graph API version.

Set a strong `DATA_ENCRYPTION_KEY` to encrypt stored provider tokens and webhook payloads. During planned key rotation, place old keys in comma-separated `DATA_ENCRYPTION_PREVIOUS_KEYS` until existing encrypted records have been migrated. Retention can be configured with `SOCIAL_MESSAGE_RETENTION_DAYS`, `SOCIAL_POST_HISTORY_RETENTION_DAYS` and `SOCIAL_PUBLISHED_ASSET_RETENTION_DAYS`.

These values belong on the backend only. The Meta callback URLs and webhook endpoint must use the public backend HTTPS origin.

The frontend needs only public build settings such as `REACT_APP_API_URL` and a public Razorpay key ID. Never place secret keys or provider tokens in a `REACT_APP_*` value.
