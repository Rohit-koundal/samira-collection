# Shopping bag

The bag uses the storefront's desktop theme and a compact mobile layout with a fixed total/continue bar. Deploy the frontend and backend changes together; an already running backend needs a restart for the new cart endpoints. No environment keys or external integrations are added.

## Customer flow

- Real checkboxes choose which lines go to checkout. Unchecked lines stay saved, including across reloads and guest sign-in. Orders, coupon validation and order quotes use only checked items; successful checkout removes only purchased lines.
- A size/colour dialog refreshes the catalogue, displays available variants and their prices, supports quantity changes, and shows the supplied size chart. Failed changes preserve the original line. Matching variants merge their quantities once, after stock validation.
- Remove opens a confirmation with a move-to-wishlist option. Wishlist saves finish before bag removal. Remove supports Undo with current price/availability validation; batch operations report partial failures.
- Totals include MRP, product savings, coupon savings, delivery and platform fees. GST is included, not charged again. Free shipping uses the merchandise subtotal before coupons, matching server order pricing. Payment-specific charges and discounts remain finalised by checkout's authoritative order quote.
- Saved addresses can be selected in the bag and carried to checkout. Guests are redirected through sign-in. Product recommendations open their product pages for informed size/colour selection.
- Unavailable products remain removable. A refresh reports current prices and stock, blocks unavailable checked items, and requires review if selected contents or prices change before continuing. The UI handles loading, failed requests, no selected items and an empty bag.

## Cart API

- Existing `GET /api/cart` refreshes catalogue data in its response without rewriting or dropping saved lines. Responses include `selected`, current `price`/`originalPrice`, `previousPrice`, `availableStock`, `unavailable` and `issue` per line.
- Existing `PUT /api/cart/:itemId` accepts quantity and/or size/colour/variant changes. Validation runs before one document save, including duplicate-line merging. Quantities are whole numbers from 1 to 20, consistent with checkout; a zero update retains the existing remove behaviour.
- `POST /api/cart/selection`: `{ itemIds: [...], selected: true | false }` updates checked lines.
- `POST /api/cart/remove-items`: `{ itemIds: [...] }` removes only those lines in the caller's bag.
- Cart writes use optimistic concurrency with bounded retries. Guest-cart transfer records prevent repeat transfer during concurrent sign-in requests. All mutations are scoped to the authenticated user or guest session.
- Browser operations are queued and acknowledged by the server. Failed requests keep existing state. Synced guest caches are not replayed over authoritative server removals; unsynced legacy saves can be retried. Focus/storage events refresh other-tab changes.
- A supplied access token must be valid on every cart endpoint. Expired tokens return 401 so the existing login-refresh flow can retry the customer request; they never silently fall back to an empty guest cart.
- Opening the bag and refreshing the login reload current contents. Concurrent refreshes are combined, and guest/customer requests have separate query-cache identities. Invalid response shapes are rejected before any saved contents are replaced. An unsuccessful initial load shows a retry state rather than an empty bag or a misleading zero count.

## Verification

Frontend coverage includes selection, checkout payloads and purchased-only cleanup, safe wishlist moves, Undo, stock/size/price changes, guest persistence, failed mutations, totals and wishlist/product regressions. Backend integration tests use temporary MongoMemoryServer databases without reading `.env` or touching the application database. Browser QA uses local fixtures at 390, 768 and 1600 pixels, including live size, quantity and move actions. These checks do not place a real customer order.
