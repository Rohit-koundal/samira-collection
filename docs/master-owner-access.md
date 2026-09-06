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
   Twilio, MSG91 or Fast2SMS SMS delivery. Fixed/demo and offline owner access
   are intentionally refused. Real owner OTP delivery also works in local
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

No .env file was changed by this implementation. Existing environment values
must be reviewed/configured by the server owner. Use independent, strong
session secrets for each client deployment. No password login was added.
SMS delivery/billing and provider template approval remain provider concerns.

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
