# Storefront loading and production checks

## What changed

- Read requests no longer activate the mobile full-screen overlay. Home, route loading and the mobile catalog render in-page skeletons; navigation remains usable. Mutation busy indicators and payment/order idempotency are unchanged.
- Public storefront reads have a 15-second transport deadline and explicit retry UI. There is no automatic retry of a payment, order, OTP or upload. A read timeout is an error, not a claim that the store loaded successfully.
- Homepage fallback to the three legacy APIs only runs for missing/unsupported endpoints (404/501), not timeouts, outages or rate limiting. Current-store cached content remains visible during background refresh; another store's previous result is not rendered while switching.
- The frontend requests `GET /api/storefront/home?format=compact`. Products occur once; collection arrays contain product IDs. The API adapter expands them to the original component contract. Servers without this format and older clients remain compatible.
- Homepage policies, theme, categories, banners and standard product rails start concurrently. Product category population and serialization run once per unique product, with 4-second Mongo query execution limits and section-level warnings. No cross-user cache or stale-stock server cache was introduced.
- Explicit public browsing routes no longer wait for the external licensing control plane. Commerce writes, capacity limits and licensed premium features retain their checks.
- `Server-Timing: home;dur=...` exposes homepage handler time without customer information. It excludes upstream hosting startup and earlier middleware.

## Verification

Run frontend regression tests for `apiSlice`, `storefrontTransport`, `Home.customization`, `Products.performance`, `ProductDetail`, `CartContext`, `WishlistContext`, and checkout. Run backend tests with `--test-concurrency=1` using the existing isolated test harness, including `storefrontPerformance.unit`, `websiteCustomization`, auth, carts, orders and payments.

The 12-product repeated-rail test fixture measures uncompressed JSON bytes and checks format parity, store isolation, configured order, publication visibility, effective sale prices and fresh stock. Its reduction is not a live-network latency benchmark.

For an isolated visual preview in PowerShell (no database, real accounts or SMS):

```powershell
$env:REACT_APP_API_URL='http://127.0.0.1:4173/api'
$env:BUILD_PATH='build/performance-preview'
node scripts/build-production.js
Remove-Item Env:REACT_APP_API_URL, Env:BUILD_PATH
$env:HOME_DELAY_MS='10000'
node scripts/preview-storefront-performance.js
```

Open `http://127.0.0.1:4173` at a 390px mobile viewport. Check the skeleton and usable navigation while the synthetic feed is delayed. Restart the preview with `HOME_DELAY_MS=20000` to check the read-timeout/retry state. Stop the preview with Ctrl+C. Do not deploy this synthetic build; normal deployment uses `npm run build` and the real production API URL.

## Hosting still matters

`render.yaml` declares a free backend. Verify the **actual deployed service's** instance type before concluding this is the live cause. Render documents that free web services sleep after 15 idle minutes and can take about a minute to spin up: https://render.com/docs/free#spinning-down-on-idle

Frontend changes cannot make a sleeping backend instantly available. For production latency, the deployment owner should choose an always-on backend instance and keep the API/database in a nearby region. No paid plan or deployment is changed by this patch. If a managed store's licence control plane sleeps too, authenticated writes can still wait for it; licence protection must not be bypassed to disguise that delay.

After deploying both backend and frontend, measure cold and warm loads on a real phone/Slow 4G: document response, JS chunks, `/api/storefront/home` time-to-first-byte, transferred bytes, image loading, and browser performance metrics. Compare `Server-Timing` with total request time; test home → listing → product → cart → checkout and back navigation. Check a fresh visit after 15+ idle minutes separately from a warm reload. Do not equate a disappearing spinner with faster data arrival.
