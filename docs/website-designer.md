# Website Designer

Open the existing **Website Designer** entry in the admin panel. It uses the existing admin/OTP authorization; no new login or credentials are needed.

## Editing safely

1. Choose a theme or create one from a preset.
2. Edit the draft. Undo and redo apply to configuration edits.
3. Preview Home, Product listing or Contact using Desktop (1440 px), Tablet (820 px) or Mobile (390 px). Fit scales the canvas without changing its media-query width.
4. Save draft to persist privately, or choose **Review & publish**, add a version note and confirm.
5. Restore a published version into the draft through Version history, review and publish it to roll back.

Presets replace appearance only. They preserve branding, homepage selections/content, contact details, footer menus, announcement wording and handheld settings. There are nine presets: Default, Premium, Minimal, Festive, Sale, Wedding, Botanical Sage, Soft Rose and Indigo Heritage. A preset does not create products, discounts, coupons or orders.

## Device boundaries

- Desktop controls apply at 1024 px and above. The existing layouts remain separate from mobile.
- Mobile overrides are off by default. Enable them explicitly for home section ordering/visibility/headings, optional shared catalog selections, header colors and product layout below 768 px. They do not remove the search icon, menu, bottom navigation or purchasing controls.
- Tablet overrides are independently opt-in for product columns/gaps at 768–1023 px.
- Branding and footer content are shared.
- Existing themes do not automatically enable the new styles. No draft is automatically published.

## Data and recovery

Catalog selection uses the admin API. Preview renders the actual customer components and public catalog, so unpublished/deleted products do not appear. Unavailable selected catalog IDs remain visible in the editor for deliberate removal.

The preview is a separate, read-only iframe with no customer cart/auth synchronization. Drafts are transferred only in memory to a matching same-origin frame; they are not placed in URLs or public API responses. Mutation requests and analytics are blocked in preview.

Theme JSON export/import provides a manual backup and transfer path. Files have a versioned format and a 500 KB limit. Invalid colors, unsafe links/images and out-of-range layouts cannot be previewed or saved from the editor.

Draft writes include the last-seen revision. A stale session gets a conflict rather than silently overwriting another admin's edits. Export the local draft before reloading a conflicting theme. Failed saves retain local changes. Invalid/missing configuration cannot reset a draft.

Deleting an inactive theme also permanently removes its version history; it requires confirmation. An active theme cannot be deleted.

## Performance and preview controls

- Live preview batches edits after 500 ms of inactivity. Incomplete fields retain the last valid preview rather than reloading the iframe.
- Updates pause while the preview is offscreen or the browser tab is hidden. **Pause live preview** also allows manual **Update preview** without losing or delaying draft edits/saves.
- Open a desktop home section with **Edit** to load its fields. Catalog searches cover all options, with at most 40 checkbox rows rendered per page.
- Continuous typing/slider movement is grouped into an undo step. History keeps at most 50 structurally shared snapshots, instead of copying the entire theme for each event.
- The initial editor no longer waits for catalog/history requests. Catalog options load on first use with only IDs/names; history loads without full configuration snapshots. Restore still retrieves the saved snapshot on the backend.
- The preview reuses unchanged catalog data and product cards. Below-the-fold desktop images load lazily. These changes do not alter device breakpoints or storefront layouts.
- Preview render failures offer an isolated retry. This does not protect unsaved edits against closing the browser or an operating-system crash; save or export regularly.

Automated regression coverage includes 1,000 continuous slider updates, a 10,000-option selector, invalid fields without iframe remounts, preview pause/resume/retry, import bounds, unchanged tenant filtering and metadata-only history. Browser frame timing/memory and live database integration still need verification on the user-managed application.

## Verification commands

Run frontend checks without starting the application:

```text
npm test -- --watchAll=false --runInBand
npm run build
node --test backend/tests/websiteCustomization.unit.test.js backend/tests/websiteDesignerPerformance.unit.test.js
```

The backend unit tests use mocked persistence and do not start a server/database. Live database/API integration and visual QA should also be performed on the user-managed running application before publishing a new theme.

No environment-file change or dependency installation is required. Restart the existing backend using your normal process to load the updated preset/schema/controller code.
