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

## Login duration

```dotenv
JWT_EXPIRES_IN=15m
JWT_ADMIN_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=30d
```

Admin accounts (including the master owner) receive a 24-hour access token by default, even when browsing in customer mode. Other accounts keep the existing `JWT_EXPIRES_IN` lifetime. `JWT_ADMIN_EXPIRES_IN` is independent of that setting; use explicit units such as `24h`. Refresh-token duration and HttpOnly cookie handling are unchanged, so a successful refresh can keep a session alive beyond 24 hours. This is an access-token lifetime, not a forced daily logout.

Logout/session revocation, blocked accounts, demo restrictions and live database permission checks still apply immediately; the longer token does not override them. Longer-lived bearer tokens also remain usable longer if stolen, so keep JWT secrets stable and private and never share login tokens.

Deploy the updated backend to each existing client (deploying only the master does not update exported projects), then sign in again to receive the new lifetime. Existing tokens retain their original expiry. New client ZIPs include these defaults; changing environment variables alone cannot add this behavior to older client code.

## Current team demo login

```text
OTP_MODE=demo
DEMO_OTP=123456
ALLOW_HOSTED_OWNER_DEMO=true
ADMIN_PHONE_NUMBERS=
```

For public login, use `OTP_MODE=production`, configure `SMS_PROVIDER` and its server-side credentials, then set `ALLOW_HOSTED_OWNER_DEMO=false`.

Supported SMS providers: `twilio`, `msg91`, `twofactor` (`2factor` alias), and `fast2sms`. Each exported client's backend selects its own provider. See [backend/SMS.md](../backend/SMS.md) for credential names, legacy compatibility and activation steps. Run `npm run check:sms` from `backend` for a configuration-only check that never prints keys or sends SMS.

Verified deployment administrators can now switch from **Settings > OTP & SMS**: save encrypted credentials as a draft, send a real test to their verified phone, then confirm the received OTP to activate. Existing environment configuration continues until activation. Keep `DATA_ENCRYPTION_KEY` stable (or retain former encryption material in `DATA_ENCRYPTION_PREVIOUS_KEYS`). An explicit `SMS_CONFIG_SOURCE=environment` is available to the hosting administrator for emergency recovery; it does not delete saved Settings. The diagnostic command above inspects environment configuration only. This selection is deployment-wide, not a shared-backend seller setting.

## Optional services

- Payments: `PAYMENTS_ENABLED`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- Reel queue: `REDIS_URL`, `REQUIRE_REDIS`, `AI_VIDEO_WORKER_URL`, `AI_VIDEO_WORKER_SERVICE_TOKEN`
- Smart product details: `GEMINI_API_KEY`, `GEMINI_MODEL`
- Product photo backgrounds: reuse `AI_VIDEO_WORKER_URL` and `AI_VIDEO_WORKER_SERVICE_TOKEN` on the backend; the same token must be configured on the worker. Deploy the updated `ai-video-worker/Dockerfile` from the repository root. It installs CPU-only rembg 2.0.67 with the U2NetP model downloaded at build time. No paid image API or Gemini key is needed. Compute/storage hosting costs still apply.
- Email: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`
- Courier providers: use the Blue Dart, Delhivery, Shiprocket, or Xpressbees keys documented in `backend/SHIPPING.md`
- Managed clients: `CONTROL_PLANE_URL`, `CLIENT_INSTALLATION_ID`, `CLIENT_LICENSE_KEY`, `LICENSE_SIGNING_PUBLIC_KEY`

## Social Studio

Facebook Login with connected Pages uses `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI` and `META_WEBHOOK_VERIFY_TOKEN`. Direct professional Instagram Login uses `INSTAGRAM_BUSINESS_APP_ID`, `INSTAGRAM_BUSINESS_APP_SECRET`, `INSTAGRAM_BUSINESS_REDIRECT_URI` and the same webhook verify token. `META_GRAPH_VERSION` selects the server-side Graph API version.

Set a strong `DATA_ENCRYPTION_KEY` to encrypt stored provider tokens and webhook payloads. During planned key rotation, place old keys in comma-separated `DATA_ENCRYPTION_PREVIOUS_KEYS` until existing encrypted records have been migrated. Retention can be configured with `SOCIAL_MESSAGE_RETENTION_DAYS`, `SOCIAL_POST_HISTORY_RETENTION_DAYS` and `SOCIAL_PUBLISHED_ASSET_RETENTION_DAYS`.

These values belong on the backend only. The Meta callback URLs and webhook endpoint must use the public backend HTTPS origin.

The frontend needs only public build settings such as `REACT_APP_API_URL` and a public Razorpay key ID. Never place secret keys or provider tokens in a `REACT_APP_*` value.

## Local product background processing

The backend prefers the configured remote image worker. Without a remote worker, it can run the same Python provider in a bounded subprocess when `ai-video-worker/.venv` and `ai-video-worker/.models/u2netp.onnx` exist. This does not start another server. To prepare a fresh Windows checkout from the repository root:

```powershell
python -m venv ai-video-worker/.venv
./ai-video-worker/.venv/Scripts/python.exe -m pip install -r ai-video-worker/requirements.txt
$env:U2NET_HOME = Join-Path (Get-Location) 'ai-video-worker/.models'
$env:OMP_NUM_THREADS = '1'
./ai-video-worker/.venv/Scripts/python.exe -c "from rembg import new_session; new_session('u2netp', providers=['CPUExecutionProvider'])"
```

On Linux, use `.venv/bin/python` and the same `U2NET_HOME` directory. Virtual environments, downloaded models, credentials and uploaded photos are not included in generated project packages; prepare the worker on each deployment. Background editing is optional: existing uploads remain available if the worker is offline. CPU work is limited to one image at a time with a 90-second backend timeout. U2NetP keeps the foreground (including a person modeling clothing), and may not preserve lace, glass or very fine edges perfectly; always review the final preview.

Presets live in `src/services/imageBackground.js`. Originals are the photos saved by the existing upload/compression flow. Background editing never overwrites them: original and edited storage references are retained in product/draft image metadata, and the selected URL is the storefront photo. Only clicking **Use this photo** uploads an edited preview; save the product/draft afterwards to persist that selection. Restoring the original does not discard the previous edit.
