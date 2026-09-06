# Lazy-loading changes

Existing routes were already split with React.lazy. This pass targets modules
and media that were still loaded before they were needed:

- Admin/seller layouts are separate chunks instead of storefront startup code.
- The login prompt module loads only when the prompt is actually opened.
- Desktop homepage code/styles load only at the existing 1024px breakpoint.
  The mobile/tablet composition and desktop composition are unchanged.
- Review, size-guide and quick-view dialogs load on opening.
- Website Designer loads its preview module/iframe near the viewport, or on
  the explicit Load storefront preview now button. Space is reserved while
  waiting, and scrolling away does not destroy the preview or reset its state.
  Browsers without IntersectionObserver load it immediately.
- Product carousels initially render only their first image. Other slides load
  when visited and stay mounted for transitions. Changing a product resets the
  selection safely. Offscreen catalog images use native lazy loading and async
  decoding; hero images retain eager/high-priority loading.
- The image compression dependency loads only when an upload actually needs
  compression. File validation and small WebP uploads do not fetch the module.
- Local loading/error boundaries keep a failed chunk from blanking the page.
  Reload is manual, never an automatic loop that could discard unsaved edits.

No dependency, backend, environment file, payment/authentication logic, or CSS
layout redesign is part of this pass. Existing auth guards still run when the
admin/seller layout loads.

Verification: frontend tests and a production build; no server was started.
Bundle sizes are gzip build measurements, not runtime latency benchmarks.
Before release, check cold-cache navigation, mobile/desktop resizing, preview
scrolling, carousel swipes and throttled/offline chunk loading in a browser.

Implementation references:
[React lazy and Suspense](https://react.dev/reference/react/lazy) and
[native image loading](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/loading).
