# Samira Collection commerce platform

Responsive ecommerce storefront, seller operations workspace, and master control plane for isolated client stores. The repository contains the React frontend and the Express/MongoDB backend used by the main platform and generated managed installations.

## Local development

Use Node.js 20. Install the frontend and backend dependencies separately:

```bash
npm install
cd backend
npm install
```

Create `backend/.env` from the safe variable names in [the environment reference](docs/environment-reference.md) and provide at least a reachable `MONGO_URI`. Start each process from the repository root in a separate terminal:

```bash
npm start
npm run server
```

The frontend uses `http://localhost:3000`; the API uses `http://localhost:5000` by default. Set `REACT_APP_API_URL=http://localhost:5000/api` for the frontend.

## Login modes

Authentication uses a short-lived access token and an HttpOnly refresh cookie. Refresh tokens are not stored in browser local storage. Logout revokes the user's existing sessions on the backend.

`OTP_MODE=demo` accepts `DEMO_OTP=123456`. This is intentionally enabled for the current team demo on localhost and the hosted test deployment. When real customer access begins, change `OTP_MODE=production`, configure the SMS provider, and set `ALLOW_HOSTED_OWNER_DEMO=false`.

## Validation

```bash
# Frontend unit and workflow coverage
set CI=true && npm test -- --watchAll=false

# Production frontend bundle
npm run build

# Backend integration and unit coverage
cd backend
npm test
```

The API readiness endpoint is `GET /health`. Production returns HTTP 503 when a required database, media store, or explicitly required Redis service is unavailable.

## Production

The root `render.yaml` describes the frontend, API, and reel queue. Production startup validates JWT secrets, MongoDB, media storage, and payment configuration when enabled. Keep every `.env` file untracked; configure secrets in the hosting provider.

Before serving real customers, follow [the production runbook](docs/production-runbook.md). It covers environment validation, backups and restore drills, health monitoring, demo OTP removal, provider webhooks, release checks, and rollback.

## Platform behavior

- Every store is scoped by its own store ID; products, orders, customers, themes, and operations stay isolated.
- Monthly and yearly plan purchases are prepaid access periods. They renew after a new payment; they are not automatic recurring mandates.
- Product/order data remains in MongoDB. Media uses R2 or Cloudinary. Reel source files are removed after their configured retention date.
- Client data exports are NDJSON streams with record counts and a SHA-256 completion checksum.
- Courier, payment, social, email, SMS, AI, and object-storage credentials stay on the backend.

Generated projects exclude master-control source and receive a separate installation identity. Updates and entitlements are assigned per installation from the main control plane.
