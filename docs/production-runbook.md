# Production runbook

Use this checklist for a public release and for every material backend or checkout change.

## 1. Required configuration

Configure secrets in the hosting provider. Do not commit `.env` files.

- `NODE_ENV=production`
- `STRICT_PRODUCTION_CONFIG=true`
- unique random `JWT_SECRET` and `JWT_REFRESH_SECRET`, each at least 32 characters
- `MONGO_URI` for the production database
- `CLIENT_ORIGINS` and `FRONTEND_URL` with the exact HTTPS frontend origins
- `AUTH_COOKIE_SAME_SITE=none` and `AUTH_COOKIE_SECURE=true` when frontend and API use different HTTPS sites
- a complete R2 or Cloudinary configuration with `REQUIRE_MEDIA_STORAGE=true`
- Razorpay key, secret, and webhook secret before setting `PAYMENTS_ENABLED=true`
- Redis when reliable asynchronous reel processing is required; set `REQUIRE_REDIS=true` only when an outage should make readiness fail

Keep the currently approved team demo configuration (`OTP_MODE=demo`, `DEMO_OTP=123456`, `ALLOW_HOSTED_OWNER_DEMO=true`) only while the deployment is restricted to testers. For public customer access, configure SMS and change to `OTP_MODE=production` and `ALLOW_HOSTED_OWNER_DEMO=false` in the same release.

## 2. Release gate

Run from a clean checkout of the exact commit being deployed:

```bash
npm install
npm run build
set CI=true && npm test -- --watchAll=false
cd backend
npm install
npm test
```

After deployment:

1. Confirm `GET /health` returns 200 with `ready: true`.
2. Complete OTP login, refresh the page, open a new tab, switch to admin/seller mode, and log out.
3. Check product browse, size/free-size add-to-bag, address, serviceability, coupon, COD and prepaid checkout.
4. Verify the payment webhook with a provider test event. The browser callback alone is not the source of truth.
5. Create a label/tracking update with the selected courier and verify customer tracking.
6. Run cancellation before fulfilment and a return/refund through the admin workflow.
7. Upload and remove a test image, then confirm the object exists/deletes in the configured media provider.
8. Check logs for startup validation, failed audit writes, slow requests, worker failures, and webhook signature failures.

## 3. Backups and recovery

- Enable MongoDB Atlas continuous backup or daily snapshots. Keep retention appropriate for order, tax, and support records.
- Enable object-storage versioning or lifecycle protection for current product media. Reel originals can follow the shorter application retention policy.
- Download a store data export before high-risk catalogue or ownership work. Verify that its final NDJSON record has `type: complete`, expected collection counts, and a matching SHA-256 checksum.
- At least monthly, restore the latest database backup into a separate non-production database and verify products, orders, payments, returns, store members, and configuration. Never test restore over production.
- Record restore time, restored snapshot timestamp, result, and reviewer. A backup that has not passed a restore drill is unverified.

## 4. Monitoring and incident response

- Monitor `/health` and alert on non-200 responses, restart loops, or rising latency.
- Create hosting alerts for `uncaughtException`, `unhandledRejection`, `AUDIT_WRITE_FAILED`, payment/refund reconciliation failures, delivery worker failures, content release failures, and reel cleanup failures.
- If MongoDB or required storage is down, keep the API out of rotation until readiness returns 200.
- If a payment provider is uncertain, do not manually mark the order paid. Reconcile with the signed webhook/provider reference.
- If a deploy fails, roll back to the last known working commit and database-compatible release. Do not roll back data by replacing the live database.

## 5. Regular maintenance

- Review dependency advisories monthly. Do not use a forced audit fix that downgrades or replaces `react-scripts`; test a planned frontend-toolchain migration separately.
- Review failed/retrying payment refunds, shipping jobs, scheduled reports, scheduled content, social posts, and reel imports.
- Check subscription expiry notifications and expired store access. Monthly/yearly access is prepaid and requires another payment unless a recurring billing product is added later.
- Rotate provider credentials after staff changes or suspected exposure, and validate the new credential before deleting the old one.
- Review master audit logs and client installation operations. Export evidence before removing old operational records.
