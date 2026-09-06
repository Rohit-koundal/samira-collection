# Audit history

The admin and seller audit pages read recorded backend events. Admins can delete individual accessible events after confirmation; seller history is read-only. This is an operational audit trail, not an immutable financial ledger or a replacement for security monitoring.

## Using the page

- Search recorded actor names, action names, entity names, references or request IDs. Old events without an actor snapshot can display the current user's name, but that name is not searchable in historical snapshots.
- Filter by action, entity, outcome, source and local calendar dates. Apply filters to fetch matching records from the API. Clear filters resets the result to page one.
- Pagination retrieves 25, 50 or 100 summaries. A server timestamp keeps subsequent pages bounded to that history window; Refresh returns to page one and includes new events.
- View details opens a scrollable modal and loads the selected event separately: identity at event time when available, timestamp, request correlation, and recorded before/after differences. Escape or Close details returns focus to the row. Background interaction and scrolling are blocked while the modal is open.
- Admins can select Delete event inside the details modal, then confirm Delete permanently. Cancel returns to the details. The selected audit document is deleted; the underlying business record is unaffected. Deletion failures remain visible and can be retried. Successful deletion refreshes the current filtered snapshot and moves back a page if necessary.
- Export this page downloads only the displayed summaries as CSV. It does not export all matching history or private snapshots. Formula-like cells are escaped.
- Desktop tables retain the existing admin styling. Narrow screens use labelled cards and stacked detail comparisons. The storefront layout is not changed.

## Coverage and meaning

| Activity | Recorded data |
| --- | --- |
| Product create/edit, visibility, archive and stock | Product reference, store, selected persisted fields and available before/after values |
| Coupon create/edit/archive/delete | Rules, discount values, eligibility and lifecycle fields |
| COD order creation, order status/cancellation and shipment updates | Order reference and actual saved status/amount or shipment metadata |
| Razorpay payment initiation, capture, authorization, failure and refund state changes | Persisted order/payment state, amount where applicable, customer or verified-webhook source |
| Manual payment status changes | Previous and updated payment status |
| Customer block/unblock and role changes | Account reference and permission/status changes; privileged role changes are owner-only |
| Store settings, existing CRM/store/content/theme/master actions | Existing events plus safe settings snapshots; private configuration events are owner-only |
| Other admin/seller/master POST/PUT/PATCH/DELETE operations | A fallback **Admin request** event with method, registered route, HTTP result and authenticated actor; NOT a claim that a record changed or a background job completed |

Detailed events suppress duplicate successful request entries. A request that subsequently fails can still have a separate rejected/failed request entry. Payment capture retries and competing cancellation claims only log the successful transition once. Payment failure recorded from the browser is labelled a customer-reported attempt, not gateway-confirmed evidence. Refund entries currently describe payment-state changes, not a complete reconciliation ledger of every partial refund.

Successful persistence of a `PAYMENT_FAILED` event means the failure was recorded successfully; the action name describes the failed payment. The Outcome filter describes audit operation / HTTP outcomes, not payment status.

No old events are fabricated. Legacy records say “Recorded (legacy)” and “Not recorded” when source or outcome was not stored. Missing actors are “Actor unavailable”, not automatically “System”. Reads, unauthenticated requests, OTP payloads and background worker stages are not captured by the admin request middleware. Reel progress remains in the reel job's own progress history.

## Access and sensitive data

- Existing `protect` + admin-mode checks remain required. Seller endpoints require `audit.read` and a verified membership; the store comes from middleware, never an audit filter supplied by the browser.
- List, filter choices and single-event reads enforce the same scope. Legacy and new master/theme/role events are hidden from client admins and sellers; only the authenticated Master Owner can read them.
- Actors have an event-time name/role snapshot. Actor queries do not populate mobile numbers, emails or session proof.
- Audit writes and legacy reads redact sensitive key names recursively, cap depth/size, strip control characters and omit binary data. Common credential patterns are also masked. Callers must still pass purpose-specific allowlisted fields: automatic redaction is not a guarantee that arbitrary free text contains no secrets.
- No request bodies, headers, OTPs, payment instruments or IP addresses are added. Old IP fields are not returned.
- `DELETE /api/admin/audit-logs/:id` requires authenticated admin mode and applies the same store and owner visibility restrictions as detail reads. It atomically deletes only the selected event; inaccessible, missing or previously deleted events return 404 with `AUDIT_EVENT_NOT_FOUND`. A missing API route has a different code and is never treated as successful deletion. The frontend checks the success flag and selected event ID before removing a row. There is no bulk deletion or seller deletion endpoint.
- A best-effort `AUDIT_LOG_DELETE` entry records the deleting admin and removed event ID without copying the original snapshots. Private removals use owner-only `MASTER_AUDIT_LOG_DELETE` entries, including legacy private events. These writes have the same failure limitations as other audit writes. The current snapshot excludes this new activity until Refresh.
- No create/edit audit endpoint, automatic retention policy or restore action is exposed. Database-owner access can still alter the collection; this is not tamper-proof/WORM storage.

The implementation follows the separation of event context, sensitive-data exclusion and safe logging failure handling described in the [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html).

## Reliability and performance

Audit writes are best-effort and separate from business transactions. They run after successful domain operations without delaying the customer response. Database buffering is disabled for the audit model. A process crash or database failure can leave gaps; no exactly-once durable/outbox guarantee is claimed.

Failed writes emit `AUDIT_WRITE_FAILED` without raw database errors or payloads. The admin list shows a warning if its serving process has experienced a failed audit write since startup. In multi-process deployments, monitor centralized server logs; this warning is process-local, not a cluster health metric. Monitor failures and storage growth through your existing hosting/logging tools.

Summary queries exclude snapshots. Details load on demand; query execution has a five-second database deadline. Pages and option sets are bounded, sorting is deterministic, regex input is escaped, and the page does not continuously poll. New additive MongoDB indexes are declared on the schema. If production disables Mongoose auto-indexing, the server owner should add the declared indexes using the deployment's normal migration process (do not drop existing indexes).

No dependency, `.env` change or server startup is required by these code changes. Restart/deploy the backend yourself to load the updated routes and model, alongside the updated frontend.

## Verification

No test here requires a listening server or MongoDB process:

```text
node --test backend/tests/audit.unit.test.js backend/tests/auditWorkflow.unit.test.js
npm test -- --watchAll=false --runInBand
npm run build
```

Live smoke test after you start your application:

1. Change a test product's stock and confirm actor, reference, previous/new stock and request ID in Audit history.
2. Filter that product's ID; open details, paginate, refresh and export the visible page.
3. Check a client admin cannot retrieve an owner event by ID, filter or options. Check a seller only sees their store.
4. In Razorpay test mode only, complete/retry a payment and confirm a single capture transition. Do not use a real charge as a test.
5. Check the audit page at desktop and narrow mobile widths, including filter wrapping, keyboard focus and details.

The additional `node --test backend/tests/audit.integration.test.js` check uses a temporary local MongoDB database and a temporary loopback HTTP listener. It requires a cached MongoDB 7.0.14 binary; runtime downloads are disabled. It never reads application database credentials or falls back to the application database, and closes both test processes after the run.

The integration check verifies actual MongoDB persistence, authenticated routes, detail loading, deletion, concurrent requests, private-event protection and an unchanged underlying product. Frontend checks cover confirmation, API failures, invalid responses, retries, pagination and keyboard focus. Visual browser QA and live deployment behavior are separate checks; the application server remains stopped.
