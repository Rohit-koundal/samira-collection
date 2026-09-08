# Master Owner and client handover

## Ownership boundary

The deployment-owned Master Owner mobile number is **+91 9816978086**.
It is defined in backend/config/masterOwner.js, not an editable admin setting.
Clients receive the storefront URL and their own mobile-OTP admin login.
Server, source repository, database, SMS/payment credentials and deployment
access remain with Rohit. Never share the owner's OTP or session with a client.

The existing admin role remains compatible with current daily workflows.
A separate systemRole and server-validated session proof protect master
operations; changing a browser/local-storage role cannot authorize an API call.
The owner account cannot be promoted, demoted, blocked, deleted or reassigned
through client/customer profile controls. An older/demo owner session does not
automatically acquire master permissions.

## First use

1. Start/restart the backend yourself after deploying these changes.
2. Use the existing mobile OTP login with 9816978086. Owner login requires a
   connected database, configured JWT_SECRET and JWT_REFRESH_SECRET, and a real
   Twilio, MSG91 or Fast2SMS SMS delivery unless the explicit demo settings
   below are enabled. Offline owner access is refused. Real SMS also works in local
   development when a real SMS provider is configured.
3. Switch to admin mode using the existing flow. Open **Master configuration**
   in the admin sidebar, or /master.
4. A new installation starts with the existing fashion structure and a locked
   configuration. Unlock explicitly before changing structure or publishing/
   activating a visual theme.
5. Choose a structural preset, review the fields and client permissions, save,
   verify the storefront, then **Lock for handover**.
6. Grant the client's own number admin access. Both this action and the older
   customer promotion endpoint require a locked configuration, NODE_ENV set
   to production, OTP_MODE set to production, and a real provider selected by
   the existing SMS configuration. An unset/mock OTP_PROVIDER is not ready.

Existing environment values must be reviewed/configured by the server owner.
Use independent, strong
session secrets for each client deployment. No password login was added.
SMS delivery/billing and provider template approval remain provider concerns.

## Local owner demo

For a demo on the development computer, add `LOCAL_OWNER_DEMO=true` to
`backend/.env` and restart the backend. Keep OTP mode in demo (the existing
default when unset). This binds the API to `127.0.0.1`; open the frontend with
`localhost` or `127.0.0.1` on the same computer. The OTP screen shows the
configured demo code, and no owner SMS is sent. Database access and session
secrets remain required. Existing environment values do not need to change.

The demo code still expires, has attempt/resend limits and can be redeemed
once. Local demo owner sessions carry a signed marker and cannot authenticate
on the live API or through a proxy. Client handover stays disabled in demo
mode. Without either demo opt-in below, or with `OTP_MODE=production`, owner
login requires real SMS. This local setting means the API cannot be reached
from another device over Wi-Fi; use real SMS for that setup.

## Hosted hybrid OTP (Render or another server)

For team testing on the deployed website, configure the **backend service** and
deploy the updated backend:

```dotenv
OTP_MODE=demo
DEMO_OTP=123456
ALLOW_HOSTED_OWNER_DEMO=false
```

With this hybrid configuration, the owner number receives a random OTP through
the configured real SMS provider. Every non-owner number uses the displayed
`123456` demo OTP without making an SMS provider request. Database access,
session secrets and working SMS credentials remain required for owner login.
Set `ALLOW_HOSTED_OWNER_DEMO=true` only when the owner must temporarily use the
displayed demo OTP too.

Both repository Render Blueprints include these demo settings. For a Render
service managed directly in the dashboard, add them under **Environment** and
redeploy; local ignored `.env` files are not deployed through Git. Frontend API
URL and backend allowed origins must point to the deployed services as usual.
The Blueprints use `autoDeployTrigger: commit`. An existing dashboard-managed
service must also have **Auto-Deploy: On Commit**; if it uses **After CI Checks
Pass** without CI checks, Render does not deploy the commit.

The API binds to `0.0.0.0` and uses the hosting platform's `PORT`. Local demo
sessions cannot be reused remotely. Resend cooldown, expiry, attempt limits,
single-use verification and saved admin sessions remain enforced.

For real operation, set `ALLOW_HOSTED_OWNER_DEMO=false` and
`OTP_MODE=production`, configure real SMS, and redeploy. Existing hosted demo
access and refresh tokens are then rejected; a real SMS login is required.
Change the same values in the Blueprint if it manages the service, so a later
Blueprint sync does not re-enable demo mode.

## Available controls

- Owner-only industry presets: fashion, electronics, art and jewellery.
- Owner-defined product attribute keys, customer-facing labels, units and
  required flags. Client admins edit product values, never field definitions.
- Fashion keeps current sizes/charts. Other profiles enforce no garment size
  selection. Configured specifications appear on desktop and mobile product
  details; values can be edited in Add/Edit Product and Product Drafts.
- Owner-only structural import/export and private preset copies. These contain
  structure only, not customer data, orders, passwords, credentials or sessions.
- Owner-only Website Designer retains its separate visual-theme export,
  presets and preview workflow. Publishing/activation requires an unlocked
  master configuration; draft edits do not modify the live storefront.
- Client Store content editor can publish approved wording/contact fields
  without changing layout, industry or theme structure. Owner can disable
  content or payment-settings editing. Existing product/order/coupon workflows
  remain available to client admins.
- Configuration revision checks prevent stale saves; history retains the
  previous 30 configurations, with actor/time/action. Navigation warnings
  protect unsaved master/content edits.

## Safe conversion and deployment

Use **one client deployment and one independent database per client**. Existing
/api/admin endpoints operate across their installation; this change does not
make them a multi-tenant SaaS. Do not give unrelated clients admin access to the
same database. Set up independent credentials, object-storage scope, job queues,
domain/CORS and payment webhooks for each deployment.

This is a reusable configuration/template layer, not an automatic server,
domain or database provisioning tool. /master/store/setup and
/master/store/convert (API prefix /api) configure the current installation.
The clone action saves a private structural preset; it does not copy databases.

Industry/sizing conversion is refused while non-archived products exist.
Existing populated attribute definitions cannot be silently removed/renamed.
There is no automatic product deletion, mass migration or invented product
data. Back up/review the catalog and archive incompatible products explicitly.
Perform conversions during a maintenance window with catalog writes stopped;
catalog checks and configuration writes are not a cross-collection transaction.
Existing order snapshots are retained.

Industry presets provide attribute/sizing profiles, not fully industry-specific
business systems. The owner still configures branding, navigation, banners,
wording, imagery and categories in the existing tools. Electronics comparison,
warranty-claim processing, art authenticity verification and other vertical
business workflows are not introduced by these presets. Fashion-specific AI
suggestions are not a generic industry generator.

## Verification and release checklist

No app/database server was started, no SMS/payment was sent and no live database
was modified during this implementation.

Automated checks:

- Frontend: npm test -- --watchAll=false --runInBand
- Production build: npm run build
- Server-free backend tests (run inside backend):
  node --test tests/masterOwner.unit.test.js tests/websiteCustomization.unit.test.js tests/websiteDesignerPerformance.unit.test.js

The full backend test suite is deliberately not run automatically: its shared
harness starts Express/Mongo and can connect to a configured test database.

Before client handover, the server owner must verify real SMS OTP/login, refresh
and logout/login; client direct requests to /api/master and
/api/admin/customization returning 403; lock/save/reload behavior; product
create/edit/draft publishing; and storefront/cart/checkout on real mobile and
desktop browsers. Automated component tests/builds do not replace live visual
or payment-provider verification.
