# Social studio: Instagram and Facebook

Open **Admin → Social studio** (`/admin/social`) or **Seller → Social studio** (`/seller/social`). The previous seller Instagram screen also opens this workspace. The mobile seller navigation includes Social studio; admin mobile navigation exposes it in More.

## What is implemented

- Connect selected Facebook Pages and their linked Instagram Business/Creator accounts through official Facebook Login. Personal Facebook/Instagram inboxes are not available through these APIs.
- Tenant-scoped, encrypted account credentials; per-role access for connecting accounts, inbox access, replying and publishing. Admin accounts belong to the default store. Sellers can switch between stores where they have active membership.
- Shared inbox with channel/search/open/unread/resolved filters, paginated history, live signed webhook ingestion, manual recent/older-history sync, text replies, attachment viewing and product-link insertion. Replies require a customer message within the preceding 24 hours. No bulk unsolicited replies or messaging-window bypass.
- Product photo/carousel posts on Facebook and Instagram; editable saved drafts containing actual product name, price, images and shopping link. Choose up to six catalogue photos in the desired order.
- Product video maker: FFmpeg renders a real silent MP4 slideshow (720×1280, 25 fps, H.264, four seconds per selected image) with product name/price. Preview, regenerate or download before explicitly publishing as a Reel to Facebook, Instagram or both. This is photo-based video creation, not generative video or automatic voice-over.
- Durable rendering/publishing jobs with leases, restart recovery, individual destination statuses, confirmed-failure retries and duplicate-click protection. A timeout after a publishing/send request is marked uncertain instead of blindly repeated.
- Disconnect deletes locally retained account tokens/conversations. It does not delete content already published on Meta. Verified deauthorization/data-deletion callbacks also remove connected-account data.

## One-time server configuration

Existing `.env` entries are never overwritten by this feature. Add the following **only if those keys do not already exist**, or configure them in your hosting dashboard. No browser-side Meta secret is needed.

The local `backend/.env` now has these new key names appended, preserving all previous bytes. Its webhook verify token was generated locally. Fill the blank App ID, App Secret and redirect URI; keep the existing generated verify token when configuring Meta's webhook.

```dotenv
META_APP_ID=
META_APP_SECRET=
META_GRAPH_VERSION=v23.0
META_REDIRECT_URI=https://YOUR-PUBLIC-API/api/social/oauth/callback
META_WEBHOOK_VERIFY_TOKEN=
```

Use a random private value for `META_WEBHOOK_VERIFY_TOKEN`. The API version is configurable; v23.0 is the pinned implementation baseline, not a claim that it is the latest release. Upgrade after testing against your Meta app's supported version.

Existing `FRONTEND_URL` is the web application's canonical origin; `PUBLIC_API_URL` is its API origin. Use a reachable HTTPS deployment or development tunnel for Meta callbacks and media. Do not use Markdown link notation in `.env` values. Localhost can display drafts/video previews, but Meta cannot fetch private localhost media or deliver webhooks there.

Existing R2 or Cloudinary storage is reused. Generated photos are converted to JPEG for Instagram compatibility. Media generation downloads only catalogue images from configured storage origins, or files within this backend's uploads directory; arbitrary URLs are not accepted. In local development without object storage, previews are written to `/uploads`; production should use durable public storage. FFmpeg must be installed by the existing `ffmpeg-static` dependency; on Linux the renderer needs an available system font (for example DejaVu Sans). Windows uses Arial. The API process needs sufficient CPU/memory and persistent job storage in MongoDB.

Tokens use the application's existing AES-256-GCM `secretBox`, whose key derives from `JWT_SECRET`. Keep that existing secret stable and private; rotating it requires reconnecting accounts. Access tokens are never sent to the frontend. Data access expiration is shown on account cards; reconnect before the displayed date or when Meta revokes access.

## Configure the Meta app

1. Create/configure a business app in [Meta for Developers](https://developers.facebook.com/apps/), with Facebook Login and the Page/Instagram messaging and publishing use cases appropriate to the app.
2. Set the exact valid OAuth redirect URI to `META_REDIRECT_URI`. OAuth starts with a top-level API navigation and a short-lived HttpOnly SameSite=Lax cookie; callback state is one-use and bound to the originating user/store. No access tokens are placed in frontend URLs.
3. Request `pages_show_list`, `pages_read_engagement`, `pages_manage_metadata`, `pages_messaging`, `pages_manage_posts`, `instagram_basic`, `instagram_manage_messages`, and `instagram_content_publish`. Partial grants are displayed; inaccessible features remain disabled.
4. Configure webhook callback `https://YOUR-PUBLIC-API/api/social/webhook` with the same verify token as the server. Subscribe Page and Instagram messaging objects/events required by your app: messages and, as available, message reads/deliveries/postbacks. The Page subscription is also requested when accounts are connected. The UI reports whether account subscription succeeded. Enable Instagram access to messages in connected tools in the account's settings.
5. Set deauthorization callback `https://YOUR-PUBLIC-API/api/social/deauthorize` and data-deletion callback `https://YOUR-PUBLIC-API/api/social/data-deletion`; these accept Meta's signed form requests. Provide your own public privacy policy and user data deletion instructions in the Meta app dashboard.
6. Use app-role/test accounts first. To onboard independent sellers and real customers, complete the permissions' required App Review/Advanced Access and business verification in Meta. Switching your own UI to production does not grant Meta permissions.
7. In Social studio choose **Continue with Facebook**, sign into the Page manager's account, grant access, and select the Pages to connect. Their linked professional Instagram accounts are added together. Existing legacy Instagram connections used a narrower integration and must be reconnected here.
8. Select **Sync inbox** for recent conversations; use **Import older** per account and **Load older messages** in a conversation to request additional available history. Webhooks bring subsequent customer messages into the workspace; the visible inbox refreshes periodically.

Meta restricts available history (including inactive Instagram Requests older than 30 days) and allows standard replies only inside the 24-hour customer-initiated window. The application cannot retrieve personal-account inboxes or guarantee that Meta exposes every historical message. Follow the API's app-specific limits. Comments, voice replies, Stories, ads, scheduling, group messaging and generative videos are outside this implementation.

## Publishing and operational behaviour

Save a draft → select photo/carousel or generate a product Reel → inspect caption/media and destinations → **Review & publish** → **Publish now**. Selecting or saving a product does not publish it. Publishing creates separate posts on each selected account. There is no automatic cross-post assumption.

The worker starts alongside the existing backend after a successful database connection. It claims one job at a time and polls every 30 seconds. Keep the API/worker process awake until processing is complete. MongoDB TTL removes expired OAuth sessions. Jobs store Meta container IDs so asynchronous processing can resume. If a process stops after requesting publication, the affected destination is shown as **Check on Meta**; an operator must verify the account before creating another post. Confirmed failed destinations can be retried without repeating successful ones. Unsaved edits remain only in the current browser view.

Message replies are saved with a per-attempt client ID before sending. Duplicate clicks with that same ID return the stored outcome. `sent` means Meta accepted the message, not proof that the customer read it. `unknown` means the response was lost or interrupted: sync/check Meta before writing a new reply. No automatic reply bot is enabled.

Generated catalogue media remains in existing storage and should be covered by the store's asset-retention process. Disconnect removes local conversations/access tokens, not generated product assets or public posts. Maintain a retention/privacy policy appropriate to your business before enabling customer messaging.

## Verification

Run the isolated suite without loading `.env`:

```text
node --test backend/modules/social-workspace/social.test.js
npm test -- --watchAll=false --runInBand src/pages/admin/SocialWorkspace.test.jsx
npm run build
```

Tests use a temporary MongoDB and mocked Meta responses; they do not send real messages or publish anything. Live activation still requires credentials, reachable callbacks, eligible accounts, Meta approvals and an authorized test using those accounts.

Official reference collections: [Instagram API](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api), [Messenger Platform](https://www.postman.com/meta/messenger-platform-api/documentation/iyp204x/messenger-platform-api), [Facebook Pages and Reels](https://www.postman.com/meta/facebook/documentation/r56bjfd/facebook-api).
