# Storefront wishlist

The wishlist uses the existing desktop ivory/wine theme and a compact mobile layout. Guests can save locally and sign in to merge their saves into their account. No environment changes or new service credentials are required.

## Customer behaviour

- Photo cards show current prices, discounts, available options, and low/out-of-stock information.
- Search saved products, filter by availability/sale/category, and sort by saved order, price, or discount. Larger lists load 40 cards at a time.
- Remove an item with Undo. Deleted or archived products remain removable without exposing hidden product details.
- Move to bag opens a desktop dialog or mobile bottom sheet. It refreshes the product before offering available sizes/colours, shows the chosen variant's price, and includes the product's size chart when supplied.
- The item leaves the wishlist only after the server accepts the bag addition. Failed requests preserve it. Existing bag selections offer View bag instead of increasing their quantity.
- Wishlist and bag counts update in navigation. Empty, loading, offline, and partial sign-in sync states have appropriate recovery actions.

## Persistence and endpoints

- Guest saves use `samira_wishlist_guest`, with migration from the existing legacy key. Browser storage failures preserve the current tab's items and explain the persistence limitation.
- Authenticated saves use atomic MongoDB add/remove operations on the user's wishlist. Reading never rewrites the saved list. Failed guest merges retain unsynced guest items for retry.
- Other-tab storage changes and window focus refresh saved data. Guest catalogue refreshes preserve changes made while the request was in flight.
- `POST /api/wishlist/resolve` accepts `{ "ids": ["product ID or slug"] }`, up to 200 identifiers, and returns current public, tenant-scoped products or unavailable placeholders. It also refreshes guest saves.
- Existing authenticated `GET /api/wishlist`, `POST /api/wishlist/:productId`, and `DELETE /api/wishlist/:productId` return the user's saved list.
- Deploy frontend and backend together; an already-running backend needs a restart to serve the new resolve endpoint.

## Validation

Frontend tests cover saving, cross-tab changes, storage failure, partial guest sync, filtering, undo, option selection, duplicate prevention, failed bag requests, variant pricing, and account/unmount response handling. Backend integration tests use an isolated MongoMemoryServer and never load `.env` or connect to the application database. Browser checks use local fixtures at phone, tablet, and desktop widths; they do not verify a live customer account.
