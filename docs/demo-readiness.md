# Full application demo audit — 6 September 2026

Scope includes customer shopping, admin, Master Owner, seller operations, social studio and product imports. Every registered screen and backend action is mapped. Connected browser journeys, isolated API workflows, component regressions and source review are distinguished below. Existing user work and runtime `.env` values were preserved.

## Coverage and evidence

- [Customer and seller screens/actions](audit-customer-seller-matrix.md)
- [Admin, Master Owner, imports and social actions](audit-admin-matrix.md)
- [Every mounted backend route/action](audit-backend-matrix.md)

### Connected browser journeys

These use the **actual production-built React app and actual Express API**, with a disposable MongoDB replica set. Logins go through the OTP UI. External services are simulated or blocked; real customer records and inventory are untouched.

| Journey | Verified result |
| --- | --- |
| All roles, mobile and desktop | **146 route/layout checks** at 390 and 1440 px: 62 customer, 54 admin, 6 Master Owner and 24 seller checks. No recorded page exceptions, failed API reads or horizontal overflow. Rendering a route is not proof that every button was clicked. |
| Mobile purchase and after-sales | OTP login → select size/colour → save bag → address → server-priced COD checkout → order success → newly downloaded valid PDF invoice → cancel order while retaining history → return request on a delivered order → return history → mark notifications read. |
| Desktop payment recovery | Buy now → checkout → simulated gateway callback → failed verification → full refresh → retained confirmation → retry the same payment → paid order. Exactly one gateway order was created despite repeated callbacks. No real charge occurred. |
| Contact and moderation | Contact form → admin inbox → read status survives reload. Newsletter signup appears in admin. A delivered-purchase review was saved by the real API, then hidden and published through admin. |
| Category/banner management | Create/delete category; upload actual image → create banner → edit subtitle preserving other fields → delete the newly created banner. |
| Master Owner | Unlock → save private preset → download valid structure JSON → delete preset → relock. Client handover correctly refuses demo-OTP provisioning; production-mode permission/provisioning paths use isolated API tests. |
| Additional responsive checks | Bag, wishlist, addresses and payment recovery at 320, 390, 820 and 1440 px, including bottom actions, scrolling, address forms and expandable order review. |

Screenshots, request traces, downloaded test invoices and results are in `.tmp/full-app-audit/`; earlier targeted responsive evidence is in `.tmp/mobile-shopping/`. Harness selector/timing corrections are separate from application defects. Management steps resumed from saved QA records where appropriate.

Temporary QA frontend/API services and MongoDB were stopped after verification. Disposable browser profiles and QA upload copies were removed; evidence was retained. Restart any already-running application backend before the demo so it loads the saved fixes.

### Automated checks

- Whole frontend suite: **497 tests passed across 77 suites**, zero failures; log in `.tmp/full-app-audit/frontend-final.log`.
- Whole backend suite: **412 tests passed**, zero failures or skips, using temporary MongoDB and mock providers. All **382 declared actions** are accounted for: 254 direct successful responses, 124 shared-handler aliases, 3 tested OAuth redirects and 1 intentionally retired endpoint. See the backend matrix for the exact evidence.
- Production build completed; the known third-party pdfmake source-map warning remains. No application ESLint warnings were introduced.
- Whitespace/diff check passed with Windows line endings.
- Ordinary backend tests now ignore application `.env`, default to a temporary database and refuse cleanup against an application database. Explicit test database configuration remains supported with isolation checks.

## Corrections made

| Area | Concrete correction |
| --- | --- |
| Login/session | Recoverable failures preserve valid login; refresh requests are shared; late responses cannot restore logout. Indian mobile numbers beginning with 91 normalize correctly. |
| Catalog/storefronts | Fixed blank desktop boutique catalog, store-scoped navigation/cache/API requests and legacy product deep links. Discounts derive from prices; stock controls respect the selected variant. |
| Bag/checkout | Buy now waits for bag persistence. Failed bag/address/payment/quote reads recover. Newly saved addresses select correctly, all desktop addresses remain available, and PIN changes recalculate COD eligibility. |
| Payment/orders | Server totals gate submission. Duplicate clicks/callbacks are guarded. Failed confirmation survives refresh and retries the same payment. Cleanup failure cannot turn a created order into a failed order. |
| Customer account/history | Malformed history/address/return responses show errors rather than false empty states. Search ignores stale responses. Contact/newsletter submissions cannot duplicate while pending; identity fields lock during OTP verification. |
| Editors/drafts | Failed/missing edit IDs cannot overwrite products with blank data. Publishing saves visible edits first; refetch preserves unsaved cards; repeated/concurrent publication creates one product. |
| Bulk/reel imports | Bulk draft cleanup now retains the local photos needed for later editing and publishing. Moving a frame into its existing group or away from a saved draft is guarded to preserve product review consistency. |
| Quick Add | Required configured attributes, sizes and measurements are editable and validated. Removed photos cannot apply late AI results. |
| Categories/banners/variants | Fixed banner typing crash and content loss on visibility edits. Admin sees inactive categories/groups. Group changes preserve valid product membership and respect other groups. |
| Admin operations | Catalog reads no longer depend on optional settings. Dashboard/reviews/subscribers/settings recover from failures. Stock edits retain failed input. Stale order/invoice reads cannot overwrite another order; invoice errors offer retry. |
| Returns | Concurrent completion cannot restock twice. One failed row update cannot undo another successful row. Refund controls explain that status updates do not transfer money. |
| Seller workspace | Fixed query recovery, storefront links, provisioning states and AWB preservation. Inbox notes explicitly stay inside the workspace and do not contact the customer. |
| Reports/media tools | Old date-range responses cannot replace current reports. Poster generation clears the previous product; clipboard errors offer manual fallback. |
| Social attachments | Incoming/history photo attachments previously failed Mongoose casting; explicit attachment subdocuments now persist correctly, covered through webhook and history workflows. |
| Backend integrity | Store boundaries, address validation, pricing and invoice tax allocation tightened. Upload authentication no longer trusts a forged localhost Host header; invalid video input returns a validation error. |

## Demo limits: setup versus missing capabilities

Passing fixture tests does not establish provider connectivity or implement an absent feature.

| Area | Current capability / demo boundary |
| --- | --- |
| MongoDB | Bounded read-only live check succeeded. Existing API returned HTTP 200 for health (`database: connected`) and products. This establishes reachability at audit time. |
| OTP/handover | Local configuration uses demo OTP. Real SMS delivery was not exercised. Client handover requires production OTP and a real SMS provider; demo login cannot provision client access. |
| Online payments | Test Razorpay credentials are configured. Verification/recovery/webhooks are tested with fixtures; real settlement is unverified and local webhook secret is absent. |
| Refunds | Admin records status after money is returned separately. The app **does not initiate a Razorpay refund**. Incoming refund webhooks are handled separately. |
| Instagram/Facebook | Meta app/callback setup is incomplete. Live connection, inbox delivery/replies and publishing require configuration and account permissions. No real social message/post was sent. |
| Notifications | In-app polling, badges, list actions and banners are covered. **Background/OS push is not implemented.** Demonstrate with the app open. |
| Shipping | Manual courier/AWB/tracking links work. **Automatic courier booking and tracking synchronization are not implemented/enabled**; credentials alone do not activate them. |
| Seller Inbox | Internal notes only; it does not deliver email, SMS or Meta messages. Provider messaging belongs to Social studio. |
| Newsletter/email | Subscriber capture/list/unsubscribe work. Campaign/welcome-email sending is not implemented. Local OTP email is mocked; live delivery was not exercised. |
| Reel/photo assistant | Gemini configuration is present, but real quota/analysis quality were not exercised. Suggestions depend on clear media/provider availability. Local video processing or a configured worker and durable media storage are required. |
| Storage | Real local multipart upload/retrieval is tested in isolation. R2 configuration is present; live R2 upload was not performed. |

## Recommended demo sequence

1. Login, refresh/open another tab, and show role-appropriate customer/admin/seller access.
2. Browse/filter, select a variant, use wishlist/bag controls, and review address and server totals.
3. Submit only an intentional demo order using COD or configured payment test mode; show history, invoice and manual tracking.
4. Use prepared eligible orders to demonstrate cancellation, review/return and in-app alerts.
5. Show product editing/Quick Add, stock, categories/banners, moderation, support, audit detail popup and reports.
6. Show seller-scoped catalog/orders/internal notes. Explain the separate Social studio connection requirement.
7. Show Master Owner templates/customization and imports. Present unavailable live operations with their actual setup state; recording a refund is not moving money.

The matrices retain unexercised combinations and integration limits rather than guaranteeing every possible production state.
