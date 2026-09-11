# Social studio: Instagram and Facebook

Open **Admin → Social studio** (`/admin/social`) or **Seller → Social studio** (`/seller/social`). The previous seller Instagram screen also opens this workspace. The mobile seller navigation includes Social studio; admin mobile navigation exposes it in More.

## What is implemented

- Connect selected Facebook Pages and their linked Instagram Business/Creator accounts through Facebook Login, or connect an Instagram professional account directly through Instagram Login. Personal inboxes are not available through the business APIs.
- Tenant-scoped, encrypted account credentials; per-role access for connecting accounts, inbox access, replying and publishing. Admin accounts belong to the default store. Sellers can switch between stores where they have active membership.
- Shared inbox with channel, work-state, assignment, priority and search filters; paginated history; text replies; attachment/product sharing; labels; snooze; private notes; reply-presence protection; and optional customer/order linking. A hidden browser tab never marks a newly arrived message as read.
- Signed webhook events are encrypted and durably queued before acknowledgement. A leased worker deduplicates and processes messages, deletions, delivery/read receipts, reactions, postbacks, story context and supported comment events. Periodic reconciliation covers missed webhooks and connection health.
- Product photo/carousel posts on Facebook and Instagram; editable drafts containing current product facts, separate channel captions, campaign labels, platform previews, browser recovery and optional scheduling with safe cancellation.
- Product video maker: FFmpeg renders a real silent MP4 slideshow (720×1280, 25 fps, H.264, four seconds per selected image) with product name/price. Preview, regenerate or download before explicitly publishing as a Reel to Facebook, Instagram or both. This is photo-based video creation, not generative video or automatic voice-over.
- Durable rendering/publishing jobs with leases, restart recovery, individual destination statuses, confirmed-failure retries and duplicate-click protection. A timeout after a publishing/send request is marked uncertain instead of blindly repeated.
- Disconnect deletes locally retained account tokens/conversations. It does not delete content already published on Meta. Verified deauthorization/data-deletion callbacks also remove connected-account data.
- Insights report store-scoped inbox volume, response time/rate, overdue conversations, publishing results and account health. Optional Gemini actions suggest a reply or captions for human review; they never send or publish automatically.

## One-time server configuration

Existing `.env` entries are never overwritten by this feature. Add the following **only if those keys do not already exist**, or configure them in your hosting dashboard. No browser-side Meta secret is needed.

The local `backend/.env` now has these new key names appended, preserving all previous bytes. Its webhook verify token was generated locally. Fill the blank App ID, App Secret and redirect URI; keep the existing generated verify token when configuring Meta's webhook.

```dotenv
META_APP_ID=
META_APP_SECRET=
META_GRAPH_VERSION=v23.0
META_REDIRECT_URI=https://YOUR-PUBLIC-API/api/social/oauth/callback
META_WEBHOOK_VERIFY_TOKEN=
INSTAGRAM_BUSINESS_APP_ID=
INSTAGRAM_BUSINESS_APP_SECRET=
INSTAGRAM_BUSINESS_REDIRECT_URI=https://YOUR-PUBLIC-API/api/social/oauth/instagram/callback
DATA_ENCRYPTION_KEY=
DATA_ENCRYPTION_PREVIOUS_KEYS=
SOCIAL_MESSAGE_RETENTION_DAYS=365
SOCIAL_POST_HISTORY_RETENTION_DAYS=730
SOCIAL_PUBLISHED_ASSET_RETENTION_DAYS=30
```

Use a random private value for `META_WEBHOOK_VERIFY_TOKEN`. The API version is configurable; v23.0 is the pinned implementation baseline, not a claim that it is the latest release. Upgrade after testing against your Meta app's supported version.

Existing `FRONTEND_URL` is the web application's canonical origin; `PUBLIC_API_URL` is its API origin. Use a reachable HTTPS deployment or development tunnel for Meta callbacks and media. Do not use Markdown link notation in `.env` values. Localhost can display drafts/video previews, but Meta cannot fetch private localhost media or deliver webhooks there.

Existing R2 or Cloudinary storage is reused. Generated photos are converted to JPEG for Instagram compatibility. Media generation downloads only catalogue images from configured storage origins, or files within this backend's uploads directory; arbitrary URLs are not accepted. In local development without object storage, previews are written to `/uploads`; production should use durable public storage. FFmpeg must be installed by the existing `ffmpeg-static` dependency; on Linux the renderer needs an available system font (for example DejaVu Sans). Windows uses Arial. The API process needs sufficient CPU/memory and persistent job storage in MongoDB.

Tokens and queued webhook payloads use the application's AES-256-GCM `secretBox`. Set a separate `DATA_ENCRYPTION_KEY`. During rotation, put the former key in the comma-separated `DATA_ENCRYPTION_PREVIOUS_KEYS` list until stored tokens have been re-encrypted or accounts reconnected. Access tokens are never sent to the frontend.

## Configure the Meta app

1. Create/configure a business app in [Meta for Developers](https://developers.facebook.com/apps/), with Facebook Login and the Page/Instagram messaging and publishing use cases appropriate to the app.
2. Set the exact valid OAuth redirect URI to `META_REDIRECT_URI`. OAuth starts with a top-level API navigation and a short-lived HttpOnly SameSite=Lax cookie; callback state is one-use and bound to the originating user/store. No access tokens are placed in frontend URLs.
3. Request `pages_show_list`, `pages_read_engagement`, `pages_manage_metadata`, `pages_messaging`, `pages_manage_posts`, `instagram_basic`, `instagram_manage_messages`, `instagram_manage_comments`, and `instagram_content_publish`. Partial grants are displayed; inaccessible features remain disabled.
4. Configure webhook callback `https://YOUR-PUBLIC-API/api/social/webhook` with the same verify token as the server. Subscribe Page and Instagram messaging objects/events required by your app: messages and, as available, message reads/deliveries/postbacks. The Page subscription is also requested when accounts are connected. The UI reports whether account subscription succeeded. Enable Instagram access to messages in connected tools in the account's settings.
5. Set deauthorization callback `https://YOUR-PUBLIC-API/api/social/deauthorize` and data-deletion callback `https://YOUR-PUBLIC-API/api/social/data-deletion`; these accept Meta's signed form requests. Provide your own public privacy policy and user data deletion instructions in the Meta app dashboard.
6. Use app-role/test accounts first. To onboard independent sellers and real customers, complete the permissions' required App Review/Advanced Access and business verification in Meta. Switching your own UI to production does not grant Meta permissions.
7. In Social studio choose **Continue with Facebook** for Pages and linked Instagram accounts. When the separate Instagram app credentials are configured, **Continue with Instagram** connects an eligible professional account without requiring a linked Page.
8. Select **Sync inbox** for recent conversations; use **Import older** per account and **Load older messages** in a conversation to request additional available history. Webhooks bring subsequent customer messages into the workspace; the visible inbox refreshes periodically.

Meta restricts available history and allows standard replies only inside the 24-hour customer-initiated window. The application cannot retrieve personal-account inboxes or guarantee every historical message. Story replies and supported comment webhook context are recorded; voice replies, ads, group messaging and generative videos remain outside this workflow.

## Publishing and operational behaviour

Save a draft → select photo/carousel or generate a product Reel → review each channel caption and preview → choose destinations → publish now or schedule. Selecting, suggesting or saving never publishes. Each destination keeps its own status and caption.

The worker starts alongside the existing backend after a successful database connection. It claims one job at a time and polls every 30 seconds. Keep the API/worker process awake until processing is complete. MongoDB TTL removes expired OAuth sessions. Jobs store Meta container IDs so asynchronous processing can resume. If a process stops after requesting publication, the affected destination is shown as **Check on Meta**; an operator must verify the account before creating another post. Confirmed failed destinations can be retried without repeating successful ones. Unsaved composer edits are recovered from the same browser and store.

Message replies are saved with a per-attempt client ID before sending. Duplicate clicks with that same ID return the stored outcome. `sent` means Meta accepted the message, not proof that the customer read it. `unknown` means the response was lost or interrupted: sync/check Meta before writing a new reply. No automatic reply bot is enabled.

Configured retention removes old social messages, idle drafts and generated publishing assets without touching original catalogue media or public posts. Disconnect removes local conversations/access tokens. Processed webhook payloads expire through MongoDB TTL.

## Verification

Run the isolated suite without loading `.env`:

```text
node --test backend/modules/social-workspace/social.test.js
npm test -- --watchAll=false --runInBand src/pages/admin/SocialWorkspace.test.jsx
npm run build
```

Tests use a temporary MongoDB and mocked Meta responses; they do not send real messages or publish anything. Live activation still requires credentials, reachable callbacks, eligible accounts, Meta approvals and an authorized test using those accounts.

Official reference collections: [Instagram API](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api), [Messenger Platform](https://www.postman.com/meta/messenger-platform-api/documentation/iyp204x/messenger-platform-api), [Facebook Pages and Reels](https://www.postman.com/meta/facebook/documentation/r56bjfd/facebook-api).
