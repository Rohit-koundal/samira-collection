# Backend end-to-end audit matrix

Generated from the actual Express route stack and response traces. No production writes or external messages are used. Requests execute the actual middleware, controllers, Mongoose models and isolated MongoDB replica sets. A passing response alone does not claim every scenario is covered: workflow assertions verify persistence, permissions, totals and state transitions.

{"routeActions":382,"executed":254,"redirectOnly":3,"negativeOnly":1,"sharedHandlerAliases":124,"notObservedDirectly":0}

Final complete backend run: **412/412 passed**, 0 failures and 0 skipped. Evidence: `.tmp/full-app-audit/backend-full-final.log`.

## Complete workflow evidence

- `applicationWorkflows.integration.test.js`: category CRUD and hide/reactivate, banner CRUD with content-preserving visibility changes, product search/store isolation, variant-group CRUD and product transfer, OTP login/session refresh, address CRUD/default selection, bag/wishlist, quote→COD checkout→fulfilment→invoice→review→return/refund, notifications, support/inbox, newsletter, profile identity verification/deletion, master template/preset/locking/settings, seller CRM/shipment/analytics/reports.
- `orders.test.js`, `payments.test.js`, `returns.test.js`, `reviews.test.js`, `coupons.test.js`, `cart.integration.test.js`, `wishlist.integration.test.js`: pricing, stock/coupon reservations, cancellation, payment signatures/webhooks/idempotency/failure recovery, return eligibility and concurrent completion, review/helpful/visibility, cart/wishlist persistence and account isolation.
- `auth.test.js`, `authRecovery.unit.test.js`, `masterOwner.unit.test.js`, `release3.test.js`, `websiteCustomization.test.js`, audit suites: auth/role boundaries, recovery, seller access, store provisioning, theme publication/history/restore and audit retention.
- Social/reel suites run real isolated persistence and media processing with mocked Meta/Gemini/storage responses. See `socialWorkspace.test.js`, `socialImport.integration.test.js`, `reelImport.test.js`, `localReelQuality.test.js`, `productFrameVision.test.js`, `geminiJson.test.js` and related suites. Some mount their module router directly and are not counted as main Express aliases below.

- `uploads.integration.test.js`: authenticated admin/seller multipart PNG and playable MP4 uploads; forged-host and customer access rejected; invalid media produces validation errors; bulk upload -> persisted draft photo -> edit -> publish -> byte-for-byte retrieval; Quick Add sends real photo bytes to a mocked Gemini response, maps categories, omits invented prices/stock and surfaces quota failure.
- `reelWorkflows.integration.test.js`: stored-video import and duplicate submission, owned list/detail, cancel/retry/delete with a test-only queue/storage adapter; persisted candidate merge/split/frame moves preserve frame identities and history; saved-draft photos and malformed moves are protected.
- `applicationWorkflows.integration.test.js` also covers client-admin handover, role switching, account deletion, theme discard/activation, store-content stale-save rejection, admin catalog/coupon archive, legacy gateway aliases and seller return ownership.
- `testHarness.unit.test.js`: test cleanup refuses any database other than the dedicated automated-test database. The shared harness does not load .env or fall back to application MONGO_URI; provider credentials are replaced with test modes.

## Mounted route modules

 - `modules/social-workspace/routes.js`
 - `routes/masterRoutes.js`
 - `routes/authRoutes.js`
 - `routes/customerAdminRoutes.js`
 - `routes/adminAuthRoutes.js`
 - `routes/adminProductRoutes.js`
 - `routes/categoryRoutes.js`
 - `routes/orderRoutes.js`
 - `routes/couponRoutes.js`
 - `routes/bannerRoutes.js`
 - `routes/reviewRoutes.js`
 - `routes/returnRoutes.js`
 - `routes/settingsRoutes.js`
 - `routes/storeContentRoutes.js`
 - `routes/websiteCustomizationRoutes.js`
 - `routes/uploadRoutes.js`
 - `routes/productDraftRoutes.js`
 - `modules/reel-product-import/reelImport.routes.js`
 - `modules/social-product-import/socialImport.routes.js`
 - `routes/variantGroupRoutes.js`
 - `routes/auditAdminRoutes.js`
 - `routes/storeRoutes.js`
 - `routes/sellerRoutes.js`
 - `routes/analyticsRoutes.js`
 - `routes/publicProductRoutes.js`
 - `routes/cartRoutes.js`
 - `routes/addressRoutes.js`
 - `routes/wishlistRoutes.js`
 - `routes/paymentRoutes.js`
 - `routes/contactRoutes.js`
 - `routes/newsletterRoutes.js`
 - `routes/notificationRoutes.js`
 - `routes/seoRoutes.js`

## Every declared route action

| Endpoint | Handler | Observed coverage | Evidence (HTTP statuses) |
|---|---|---|---|
| `OPTIONS /*` | inline handler | Executed | real-frontend-browser-journeys (204) |
| `POST /api/payments/webhook/razorpay` | inline handler | Executed | payments.test.js (200, 400) |
| `GET /api/social/webhook` | modules/social-workspace/inbox.js#verifyWebhook | Executed | socialWorkspace.test.js (200, 403) |
| `POST /api/social/webhook` | inline handler | Executed | socialWorkspace.test.js (200, 403) |
| `GET /api/social/oauth/start` | inline handler | Redirect response exercised | socialWorkspace.test.js (302) |
| `GET /api/social/oauth/callback` | inline handler | Redirect response exercised | socialWorkspace.test.js (302, 400) |
| `POST /api/social/deauthorize` | inline handler | Shared handler success via alias | socialWorkspace.test.js (200) |
| `POST /api/social/data-deletion` | inline handler | Executed | socialWorkspace.test.js (200) |
| `GET /api/social/deletion-status/:code` | inline handler | Executed | socialWorkspace.test.js (200, 404) |
| `GET /api/social/status` | inline handler | Executed | socialWorkspace.test.js (200, 401, 403) |
| `POST /api/social/connect` | inline handler | Executed | socialWorkspace.test.js (200, 403) |
| `GET /api/social/pending/:id` | inline handler | Executed | socialWorkspace.test.js (200, 404) |
| `POST /api/social/pending/:id` | inline handler | Executed | socialWorkspace.test.js (200) |
| `DELETE /api/social/accounts/:id` | inline handler | Executed | socialWorkspace.test.js (200, 404) |
| `POST /api/social/accounts/:id/sync` | inline handler | Executed | socialWorkspace.test.js (200, 409) |
| `GET /api/social/threads` | inline handler | Executed | socialWorkspace.test.js (200, 403) |
| `GET /api/social/threads/:id` | inline handler | Executed | socialWorkspace.test.js (200, 404) |
| `PATCH /api/social/threads/:id` | inline handler | Executed | socialWorkspace.test.js (200) |
| `POST /api/social/threads/:id/history` | inline handler | Executed | socialWorkspace.test.js (200, 400, 403) |
| `POST /api/social/threads/:id/reply` | inline handler | Executed | socialWorkspace.test.js (200, 404, 409) |
| `GET /api/social/products` | inline handler | Executed | socialWorkspace.test.js (200) |
| `GET /api/social/posts` | inline handler | Executed | socialWorkspace.test.js (200, 403) |
| `GET /api/social/posts/:id` | inline handler | Executed | socialWorkspace.test.js (200, 400, 403, 404) |
| `POST /api/social/posts` | inline handler | Executed | socialWorkspace.test.js (200, 400, 403, 404) |
| `PUT /api/social/posts/:id` | inline handler | Executed | socialWorkspace.test.js (200) |
| `POST /api/social/posts/:id/video` | inline handler | Executed | socialWorkspace.test.js (202, 403, 409) |
| `POST /api/social/posts/:id/publish` | inline handler | Executed | socialWorkspace.test.js (200) |
| `POST /api/social/posts/:id/retry` | inline handler | Executed | socialWorkspace.test.js (202, 400, 403, 409) |
| `DELETE /api/social/posts/:id` | inline handler | Executed | socialWorkspace.test.js (200, 401, 403, 409) |
| `GET /uploads/:filename` | inline handler | Executed | uploads.integration.test.js, real-frontend-browser-journeys (200) |
| `GET /placeholder.jpg` | inline handler | Shared handler success via alias | uploads.integration.test.js, real-frontend-browser-journeys (200) |
| `GET /` | inline handler | Executed | real-frontend-browser-journeys (200, 304) |
| `GET /health` | inline handler | Executed | leftovers.test.js (200) |
| `GET /api/master` | controllers/masterController.js#workspace | Executed | applicationWorkflows.integration.test.js (200, 403) |
| `PUT /api/master/configuration` | controllers/masterController.js#update | Executed | applicationWorkflows.integration.test.js, websiteCustomization.test.js (200) |
| `POST /api/master/store/setup` | controllers/masterController.js#update | Shared handler success via alias | applicationWorkflows.integration.test.js, websiteCustomization.test.js (200) |
| `POST /api/master/store/convert` | controllers/masterController.js#update | Shared handler success via alias | applicationWorkflows.integration.test.js, websiteCustomization.test.js (200) |
| `GET /api/master/export` | controllers/masterController.js#export | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/master/import` | controllers/masterController.js#import | Executed | applicationWorkflows.integration.test.js (200, 403) |
| `POST /api/master/presets` | controllers/masterController.js#createPreset | Executed | applicationWorkflows.integration.test.js (201) |
| `POST /api/master/clone` | controllers/masterController.js#createPreset | Shared handler success via alias | applicationWorkflows.integration.test.js (201) |
| `DELETE /api/master/presets/:id` | controllers/masterController.js#deletePreset | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/master/client-admins` | controllers/masterController.js#provisionAdmin | Executed | applicationWorkflows.integration.test.js, real-frontend-browser-journeys (201, 403) |
| `GET /api/catalog-configuration` | controllers/masterController.js#publicCatalog | Executed | applicationWorkflows.integration.test.js, real-frontend-browser-journeys (200) |
| `POST /api/auth/send-otp` | controllers/authController.js#sendOtp | Executed | applicationWorkflows.integration.test.js, auth.test.js (200) |
| `POST /api/auth/verify-otp` | controllers/authController.js#verifyOtp | Executed | applicationWorkflows.integration.test.js, auth.test.js (200, 400) |
| `POST /api/auth/resend-otp` | controllers/authController.js#sendOtp | Shared handler success via alias | applicationWorkflows.integration.test.js, auth.test.js (200) |
| `POST /api/auth/profile/send-phone-change-otp` | controllers/authController.js#sendProfilePhoneChangeOtp | Executed | applicationWorkflows.integration.test.js (200, 400) |
| `POST /api/auth/profile/verify-phone-change-otp` | controllers/authController.js#verifyProfilePhoneChangeOtp | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/auth/profile/send-email-change-otp` | controllers/authController.js#sendProfileEmailChangeOtp | Executed | applicationWorkflows.integration.test.js (200, 400) |
| `POST /api/auth/profile/verify-email-change-otp` | controllers/authController.js#verifyProfileEmailChangeOtp | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/auth/refresh` | controllers/authController.js#refresh | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/auth/me` | controllers/authController.js#me | Executed | applicationWorkflows.integration.test.js, auth.test.js, release3.test.js (200, 401) |
| `POST /api/auth/logout` | controllers/authController.js#logout | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/auth/switch-mode` | controllers/authController.js#switchMode | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/auth/profile` | controllers/authController.js#profile | Executed | applicationWorkflows.integration.test.js (200) |
| `PUT /api/auth/profile` | controllers/authController.js#updateProfile | Executed | applicationWorkflows.integration.test.js (200) |
| `DELETE /api/auth/profile` | controllers/authController.js#deleteProfile | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/customers` | inline handler | Executed | applicationWorkflows.integration.test.js (200) |
| `PATCH /api/admin/customers/:userId/block` | inline handler | Executed | auth.test.js, applicationWorkflows.integration.test.js (200, 400, 403) |
| `PATCH /api/admin/customers/:userId/promote-admin` | inline handler | Executed | auth.test.js, applicationWorkflows.integration.test.js (200, 401, 403) |
| `PATCH /api/admin/customers/:userId/demote-admin` | inline handler | Executed | auth.test.js, applicationWorkflows.integration.test.js (200, 403) |
| `GET /api/admin/users` | inline handler | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `PATCH /api/admin/users/:userId/block` | inline handler | Shared handler success via alias | auth.test.js, applicationWorkflows.integration.test.js (200, 400, 403) |
| `PATCH /api/admin/users/:userId/promote-admin` | inline handler | Shared handler success via alias | auth.test.js, applicationWorkflows.integration.test.js (200, 401, 403) |
| `PATCH /api/admin/users/:userId/demote-admin` | inline handler | Shared handler success via alias | auth.test.js, applicationWorkflows.integration.test.js (200, 403) |
| `POST /api/admin/login` | controllers/authController.js#adminLogin | Failure/guard exercised | auth.test.js (410) |
| `GET /api/admin/profile` | controllers/authController.js#profile | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/dashboard/stats` | controllers/dashboardController.js#stats | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/dashboard/overview` | controllers/dashboardController.js#overview | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/dashboard/recent-orders` | controllers/dashboardController.js#recentOrders | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/dashboard/low-stock` | controllers/dashboardController.js#lowStock | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/inventory/low-stock` | controllers/dashboardController.js#lowStock | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/reports/sales` | controllers/dashboardController.js#salesReport | Executed | release2.test.js (200) |
| `GET /api/admin/reports/products` | controllers/dashboardController.js#productReport | Executed | release2.test.js (200) |
| `GET /api/admin/products` | controllers/productController.js#getProducts | Executed | release3.test.js (200) |
| `GET /api/admin/products/quick-analyze/status` | controllers/productController.js#getQuickAddVisionStatus | Executed | uploads.integration.test.js (200) |
| `POST /api/admin/products/quick-analyze` | controllers/productController.js#analyzeQuickAdd | Executed | uploads.integration.test.js (200, 400) |
| `GET /api/admin/products/:id` | controllers/productController.js#getProductById | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/admin/products` | controllers/productController.js#createProduct | Executed | productLinks.test.js, productSizingApi.test.js, release3.test.js, applicationWorkflows.integration.test.js (201, 400) |
| `PUT /api/admin/products/:id` | controllers/productController.js#updateProduct | Executed | socialImport.integration.test.js, applicationWorkflows.integration.test.js (200) |
| `DELETE /api/admin/products/:id` | controllers/productController.js#deleteProduct | Executed | release3.test.js, applicationWorkflows.integration.test.js (200, 400) |
| `PATCH /api/admin/products/:id/status` | controllers/productController.js#updateStatus | Executed | applicationWorkflows.integration.test.js (200) |
| `PATCH /api/admin/products/:id/stock` | controllers/productController.js#updateStock | Executed | release3.test.js, applicationWorkflows.integration.test.js (200) |
| `PATCH /api/admin/products/:id/mark-out-of-stock` | controllers/productController.js#markOutOfStock | Executed | applicationWorkflows.integration.test.js (200) |
| `PATCH /api/admin/products/:id/hide` | controllers/productController.js#hideProduct | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/categories` | controllers/categoryController.js#getCategories | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/admin/categories/admin/create` | controllers/categoryController.js#createCategory | Shared handler success via alias | applicationWorkflows.integration.test.js, release3.test.js (201, 400) |
| `PUT /api/admin/categories/admin/:id` | controllers/categoryController.js#updateCategory | Shared handler success via alias | applicationWorkflows.integration.test.js (200, 400) |
| `DELETE /api/admin/categories/admin/:id` | controllers/categoryController.js#deleteCategory | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/categories/:id` | controllers/categoryController.js#getCategoryById | Executed | applicationWorkflows.integration.test.js (200, 400, 404) |
| `POST /api/admin/categories` | controllers/categoryController.js#createCategory | Executed | applicationWorkflows.integration.test.js, release3.test.js (201, 400) |
| `PUT /api/admin/categories/:id` | controllers/categoryController.js#updateCategory | Executed | applicationWorkflows.integration.test.js (200, 400) |
| `DELETE /api/admin/categories/:id` | controllers/categoryController.js#deleteCategory | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/admin/orders` | controllers/orderController.js#createOrder | Shared handler success via alias | paymentSettings.test.js, applicationWorkflows.integration.test.js (201, 400) |
| `POST /api/admin/orders/cod` | controllers/orderController.js#createCodOrder | Shared handler success via alias | applicationWorkflows.integration.test.js, returns.test.js, coupons.test.js, orders.test.js, paymentSettings.test.js, release2.test.js, release3.test.js, reviews.test.js, variants.test.js (201, 400, 403, 409) |
| `POST /api/admin/orders/quote` | controllers/orderController.js#quoteOrder | Shared handler success via alias | applicationWorkflows.integration.test.js, orders.test.js, paymentSettings.test.js (200) |
| `GET /api/admin/orders` | controllers/orderController.js#adminOrders | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/orders/:id/receipt` | controllers/orderController.js#receipt | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `PUT /api/admin/orders/:id/status` | controllers/orderController.js#updateOrderStatus | Executed | applicationWorkflows.integration.test.js, returns.test.js, orders.test.js, reviews.test.js (200) |
| `PUT /api/admin/orders/:id/payment-status` | controllers/orderController.js#updatePaymentStatus | Executed | applicationWorkflows.integration.test.js (200) |
| `PUT /api/admin/orders/:id/shipment` | controllers/orderController.js#updateShipment | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `DELETE /api/admin/orders/:id` | controllers/orderController.js#deleteOrder | Executed | orders.test.js (200) |
| `POST /api/admin/orders/:id/cancel` | controllers/orderController.js#cancelOrder | Shared handler success via alias | orders.test.js (200, 403, 409) |
| `GET /api/admin/orders/my-orders` | controllers/orderController.js#myOrders | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/orders/admin/all` | controllers/orderController.js#adminOrders | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/orders/admin/:id` | controllers/orderController.js#getOrder | Shared handler success via alias | applicationWorkflows.integration.test.js, orders.test.js (200, 403, 404) |
| `GET /api/admin/orders/admin/:id/receipt` | controllers/orderController.js#receipt | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `PUT /api/admin/orders/admin/:id/status` | controllers/orderController.js#updateOrderStatus | Shared handler success via alias | applicationWorkflows.integration.test.js, returns.test.js, orders.test.js, reviews.test.js (200) |
| `PUT /api/admin/orders/admin/:id/payment-status` | controllers/orderController.js#updatePaymentStatus | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/orders/:id` | controllers/orderController.js#getOrder | Shared handler success via alias | applicationWorkflows.integration.test.js, orders.test.js (200, 403, 404) |
| `GET /api/admin/coupons` | controllers/couponController.js#getCoupons | Executed | coupons.test.js, applicationWorkflows.integration.test.js (200) |
| `POST /api/admin/coupons/available` | controllers/couponController.js#getAvailableCoupons | Shared handler success via alias | coupons.test.js, applicationWorkflows.integration.test.js (200) |
| `POST /api/admin/coupons/apply` | controllers/couponController.js#applyCoupon | Shared handler success via alias | coupons.test.js, applicationWorkflows.integration.test.js (200, 400) |
| `POST /api/admin/coupons` | controllers/couponController.js#createCoupon | Executed | coupons.test.js, applicationWorkflows.integration.test.js (201, 400, 403, 409) |
| `PUT /api/admin/coupons/:id` | controllers/couponController.js#updateCoupon | Executed | coupons.test.js, applicationWorkflows.integration.test.js (200, 400) |
| `DELETE /api/admin/coupons/:id` | controllers/couponController.js#deleteCoupon | Executed | coupons.test.js, applicationWorkflows.integration.test.js (200) |
| `POST /api/admin/coupons/admin/create` | controllers/couponController.js#createCoupon | Shared handler success via alias | coupons.test.js, applicationWorkflows.integration.test.js (201, 400, 403, 409) |
| `PUT /api/admin/coupons/admin/:id` | controllers/couponController.js#updateCoupon | Shared handler success via alias | coupons.test.js, applicationWorkflows.integration.test.js (200, 400) |
| `DELETE /api/admin/coupons/admin/:id` | controllers/couponController.js#deleteCoupon | Shared handler success via alias | coupons.test.js, applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/banners` | controllers/bannerController.js#getBanners | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/banners/:id` | controllers/bannerController.js#getBannerById | Executed | applicationWorkflows.integration.test.js (200, 400) |
| `POST /api/admin/banners` | controllers/bannerController.js#createBanner | Executed | applicationWorkflows.integration.test.js (201) |
| `PUT /api/admin/banners/:id` | controllers/bannerController.js#updateBanner | Executed | applicationWorkflows.integration.test.js (200) |
| `DELETE /api/admin/banners/:id` | controllers/bannerController.js#deleteBanner | Executed | applicationWorkflows.integration.test.js (200, 404) |
| `GET /api/admin/reviews` | controllers/reviewController.js#adminReviews | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/reviews/admin/all` | controllers/reviewController.js#adminReviews | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `PATCH /api/admin/reviews/admin/:id/visibility` | controllers/reviewController.js#toggleVisibility | Shared handler success via alias | reviews.test.js, applicationWorkflows.integration.test.js (200) |
| `DELETE /api/admin/reviews/admin/:id` | controllers/reviewController.js#deleteReview | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/reviews/featured` | controllers/reviewController.js#featuredReviews | Shared handler success via alias | reviews.test.js, applicationWorkflows.integration.test.js (200) |
| `PATCH /api/admin/reviews/:id/visibility` | controllers/reviewController.js#toggleVisibility | Executed | reviews.test.js, applicationWorkflows.integration.test.js (200) |
| `DELETE /api/admin/reviews/:id` | controllers/reviewController.js#deleteReview | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/reviews/:productId/summary` | controllers/reviewController.js#getReviewSummary | Shared handler success via alias | reviews.test.js (200) |
| `GET /api/admin/reviews/:productId/eligibility` | controllers/reviewController.js#getReviewEligibility | Shared handler success via alias | reviews.test.js (200) |
| `POST /api/admin/reviews/:id/helpful` | controllers/reviewController.js#toggleHelpful | Shared handler success via alias | reviews.test.js (200, 403) |
| `POST /api/admin/reviews/:productId` | controllers/reviewController.js#createReview | Shared handler success via alias | applicationWorkflows.integration.test.js, reviews.test.js (201, 403, 409) |
| `GET /api/admin/reviews/:productId/mine` | controllers/reviewController.js#getMyReview | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `PUT /api/admin/reviews/:id` | controllers/reviewController.js#updateReview | Shared handler success via alias | applicationWorkflows.integration.test.js, reviews.test.js (200, 400, 403) |
| `GET /api/admin/reviews/:productId` | controllers/reviewController.js#getReviews | Shared handler success via alias | reviews.test.js (200) |
| `POST /api/admin/returns` | controllers/returnController.js#createReturn | Shared handler success via alias | applicationWorkflows.integration.test.js, returns.test.js (201, 400) |
| `GET /api/admin/returns` | controllers/returnController.js#adminReturns | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/returns/my-requests` | controllers/returnController.js#myReturns | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/returns/order/:orderId` | controllers/returnController.js#orderReturns | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/returns/admin/all` | controllers/returnController.js#adminReturns | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `PUT /api/admin/returns/admin/:id/status` | controllers/returnController.js#updateReturnStatus | Shared handler success via alias | applicationWorkflows.integration.test.js, returns.test.js (200, 404) |
| `PUT /api/admin/returns/:id/status` | controllers/returnController.js#updateReturnStatus | Executed | applicationWorkflows.integration.test.js, returns.test.js (200) |
| `GET /api/admin/settings` | controllers/settingsController.js#getSettings | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/settings/payment-methods` | controllers/settingsController.js#getPaymentMethods | Shared handler success via alias | paymentSettings.test.js (200) |
| `GET /api/admin/settings/payment-readiness` | controllers/settingsController.js#getPaymentReadiness | Executed | paymentSettings.test.js (200) |
| `PUT /api/admin/settings` | controllers/settingsController.js#updateSettings | Executed | applicationWorkflows.integration.test.js (200) |
| `PUT /api/admin/settings/admin/update` | controllers/settingsController.js#updateSettings | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/store-content` | controllers/storeContentController.js#get | Executed | applicationWorkflows.integration.test.js (200) |
| `PUT /api/admin/store-content` | controllers/storeContentController.js#update | Executed | applicationWorkflows.integration.test.js (200, 409) |
| `GET /api/admin/customization` | controllers/websiteCustomizationController.js#getWorkspace | Executed | websiteCustomization.test.js, applicationWorkflows.integration.test.js (200, 401, 403) |
| `GET /api/admin/customization/presets` | controllers/websiteCustomizationController.js#getPresets | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/customization/themes` | controllers/websiteCustomizationController.js#listThemes | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/admin/customization/themes` | controllers/websiteCustomizationController.js#createTheme | Executed | websiteCustomization.test.js (201) |
| `GET /api/admin/customization/themes/:id` | controllers/websiteCustomizationController.js#getTheme | Executed | applicationWorkflows.integration.test.js (200) |
| `PUT /api/admin/customization/themes/:id/draft` | controllers/websiteCustomizationController.js#updateDraft | Executed | websiteCustomization.test.js, applicationWorkflows.integration.test.js (200) |
| `POST /api/admin/customization/themes/:id/discard` | controllers/websiteCustomizationController.js#discardDraft | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/admin/customization/themes/:id/duplicate` | controllers/websiteCustomizationController.js#duplicateTheme | Executed | websiteCustomization.test.js (201) |
| `POST /api/admin/customization/themes/:id/publish` | controllers/websiteCustomizationController.js#publishTheme | Executed | websiteCustomization.test.js (200, 403) |
| `POST /api/admin/customization/themes/:id/activate` | controllers/websiteCustomizationController.js#activateTheme | Executed | applicationWorkflows.integration.test.js (200) |
| `DELETE /api/admin/customization/themes/:id` | controllers/websiteCustomizationController.js#deleteTheme | Executed | websiteCustomization.test.js (200, 409) |
| `GET /api/admin/customization/themes/:id/history` | controllers/websiteCustomizationController.js#getHistory | Executed | websiteCustomization.test.js (200) |
| `POST /api/admin/customization/themes/:id/history/:versionId/restore` | controllers/websiteCustomizationController.js#restoreVersion | Executed | websiteCustomization.test.js (200) |
| `POST /api/admin/uploads` | inline handler | Executed | uploads.integration.test.js (201, 400, 401, 403) |
| `POST /api/admin/uploads/videos` | inline handler | Executed | uploads.integration.test.js (201, 400, 401) |
| `POST /api/admin/upload` | inline handler | Shared handler success; guards checked at this mount | uploads.integration.test.js (201, 400, 401, 403) |
| `POST /api/admin/upload/videos` | inline handler | Shared handler success via alias | uploads.integration.test.js (201, 400, 401) |
| `POST /api/admin/product-drafts/bulk-upload` | controllers/productDraftController.js#bulkUpload | Executed | uploads.integration.test.js (201) |
| `POST /api/admin/product-drafts/publish-selected` | controllers/productDraftController.js#publishSelected | Executed | productDraftWorkflows.test.js, socialImport.integration.test.js, uploads.integration.test.js (200, 400, 404) |
| `GET /api/admin/product-drafts` | controllers/productDraftController.js#listDrafts | Executed | productDraftWorkflows.test.js, uploads.integration.test.js (200, 403) |
| `GET /api/admin/product-drafts/:id` | controllers/productDraftController.js#getDraft | Executed | productDraftWorkflows.test.js, uploads.integration.test.js (200, 400) |
| `PUT /api/admin/product-drafts/:id` | controllers/productDraftController.js#updateDraft | Executed | productDraftWorkflows.test.js, socialImport.integration.test.js, uploads.integration.test.js (200, 400, 403, 409) |
| `DELETE /api/admin/product-drafts/:id` | controllers/productDraftController.js#deleteDraft | Executed | productDraftWorkflows.test.js (200, 404) |
| `GET /api/admin/reel-imports/capabilities` | modules/reel-product-import/reelImport.controller.js#getUploadCapabilities | Executed | reelImport.test.js (200, 401) |
| `POST /api/admin/reel-imports/upload-url` | modules/reel-product-import/reelImport.controller.js#getUploadCapabilities | Shared handler success via alias | reelImport.test.js (200, 401) |
| `POST /api/admin/reel-imports` | modules/reel-product-import/reelImport.controller.js#createImport | Executed | reelWorkflows.integration.test.js (200, 202) |
| `GET /api/admin/reel-imports` | modules/reel-product-import/reelImport.controller.js#listImports | Executed | reelWorkflows.integration.test.js (200) |
| `GET /api/admin/reel-imports/:jobId` | modules/reel-product-import/reelImport.controller.js#getImport | Executed | reelImport.test.js, reelWorkflows.integration.test.js (200, 404) |
| `GET /api/admin/reel-imports/:jobId/candidates` | modules/reel-product-import/reelImport.controller.js#listCandidates | Executed | reelWorkflows.integration.test.js (200) |
| `POST /api/admin/reel-imports/:jobId/retry` | modules/reel-product-import/reelImport.controller.js#retryImport | Executed | reelWorkflows.integration.test.js (202, 409) |
| `POST /api/admin/reel-imports/:jobId/cancel` | modules/reel-product-import/reelImport.controller.js#cancelImport | Executed | reelWorkflows.integration.test.js (200) |
| `DELETE /api/admin/reel-imports/:jobId` | modules/reel-product-import/reelImport.controller.js#deleteImport | Executed | reelWorkflows.integration.test.js (200, 404, 409) |
| `PATCH /api/admin/reel-imports/:jobId/candidates/:candidateId` | modules/reel-product-import/reelImport.controller.js#updateCandidate | Executed | socialImport.integration.test.js (200, 409) |
| `POST /api/admin/reel-imports/:jobId/candidates/:candidateId/analyze` | modules/reel-product-import/reelImport.controller.js#analyzeCandidate | Executed | socialImport.integration.test.js (200) |
| `POST /api/admin/reel-imports/:jobId/candidates/merge` | modules/reel-product-import/reelImport.controller.js#mergeCandidates | Executed | reelWorkflows.integration.test.js (201, 404) |
| `POST /api/admin/reel-imports/:jobId/candidates/:candidateId/split` | modules/reel-product-import/reelImport.controller.js#splitCandidate | Executed | reelWorkflows.integration.test.js (201) |
| `POST /api/admin/reel-imports/:jobId/candidates/:candidateId/move-frame` | modules/reel-product-import/reelImport.controller.js#moveFrame | Executed | reelWorkflows.integration.test.js (200, 400, 409) |
| `POST /api/admin/reel-imports/:jobId/create-drafts` | modules/reel-product-import/reelImport.controller.js#createDrafts | Executed | reelImport.test.js, socialImport.integration.test.js (201, 400) |
| `GET /api/admin/social-imports/capabilities` | modules/social-product-import/socialImport.controller.js#capabilities | Executed | reelWorkflows.integration.test.js (200) |
| `GET /api/admin/social-imports` | modules/social-product-import/socialImport.controller.js#list | Executed | socialImport.integration.test.js (200) |
| `POST /api/admin/social-imports` | modules/social-product-import/socialImport.controller.js#create | Executed | socialImport.integration.test.js (200, 202, 400, 401, 403) |
| `GET /api/admin/social-imports/:id` | modules/social-product-import/socialImport.controller.js#get | Executed | socialImport.integration.test.js (200, 404) |
| `POST /api/admin/social-imports/:id/retry` | modules/social-product-import/socialImport.controller.js#retry | Executed | socialImport.integration.test.js (200, 409) |
| `POST /api/admin/social-imports/:id/cancel` | modules/social-product-import/socialImport.controller.js#cancel | Executed | socialImport.integration.test.js (200) |
| `POST /api/admin/social-imports/:id/draft` | modules/social-product-import/socialImport.controller.js#createDraft | Executed | socialImport.integration.test.js (200, 201, 400, 409) |
| `POST /api/admin/social-imports/:id/review` | modules/social-product-import/socialImport.controller.js#saveReview | Executed | socialImport.integration.test.js (200) |
| `POST /api/admin/social-imports/:id/publish` | modules/social-product-import/socialImport.controller.js#publishReview | Executed | socialImport.integration.test.js (200, 400, 404, 409) |
| `GET /api/admin/variant-groups` | controllers/variantGroupController.js#listGroups | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/variant-groups/:id` | controllers/variantGroupController.js#getGroup | Shared handler success via alias | applicationWorkflows.integration.test.js (200, 404) |
| `POST /api/admin/variant-groups` | controllers/variantGroupController.js#createGroup | Executed | applicationWorkflows.integration.test.js (201, 400) |
| `PUT /api/admin/variant-groups/:id` | controllers/variantGroupController.js#updateGroup | Executed | applicationWorkflows.integration.test.js (200) |
| `DELETE /api/admin/variant-groups/:id` | controllers/variantGroupController.js#deleteGroup | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/admin/variant-groups/:id/add-products` | controllers/variantGroupController.js#addProducts | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/admin/variant-groups/:id/remove-products` | controllers/variantGroupController.js#removeProducts | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/audit-logs` | controllers/auditController.js#list | Executed | audit.integration.test.js (200) |
| `GET /api/admin/audit-logs/options` | controllers/auditController.js#options | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/audit-logs/:id` | controllers/auditController.js#get | Executed | audit.integration.test.js (200) |
| `DELETE /api/admin/audit-logs/:id` | controllers/auditController.js#remove | Executed | audit.integration.test.js (200, 401, 403, 404) |
| `GET /api/stores` | controllers/storeController.js#listMine | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/stores` | controllers/storeController.js#createStore | Executed | applicationWorkflows.integration.test.js, leftovers.test.js, release3.test.js, uploads.integration.test.js (201, 403) |
| `GET /api/stores/resolve` | controllers/storeController.js#resolveHost | Executed | leftovers.test.js (200) |
| `GET /api/stores/me/current` | controllers/storeController.js#getMine | Executed | applicationWorkflows.integration.test.js (200) |
| `PUT /api/stores/me/current` | controllers/storeController.js#updateMine | Executed | leftovers.test.js (200) |
| `POST /api/stores/me/current/publish` | controllers/storeController.js#publishMine | Executed | leftovers.test.js (200) |
| `GET /api/stores/:slug` | controllers/storeController.js#getPublic | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/seller/products` | controllers/productController.js#getProducts | Executed | release3.test.js (200) |
| `GET /api/seller/products/quick-analyze/status` | controllers/productController.js#getQuickAddVisionStatus | Executed | uploads.integration.test.js (200) |
| `POST /api/seller/products/quick-analyze` | controllers/productController.js#analyzeQuickAdd | Executed | uploads.integration.test.js (200) |
| `GET /api/seller/products/:id` | controllers/productController.js#getProductById | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `POST /api/seller/products` | controllers/productController.js#createProduct | Executed | release3.test.js (201) |
| `PUT /api/seller/products/:id` | controllers/productController.js#updateProduct | Shared handler success via alias | socialImport.integration.test.js, applicationWorkflows.integration.test.js (200) |
| `DELETE /api/seller/products/:id` | controllers/productController.js#deleteProduct | Shared handler success via alias | release3.test.js, applicationWorkflows.integration.test.js (200, 400) |
| `PATCH /api/seller/products/:id/status` | controllers/productController.js#updateStatus | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `PATCH /api/seller/products/:id/stock` | controllers/productController.js#updateStock | Shared handler success via alias | release3.test.js, applicationWorkflows.integration.test.js (200) |
| `GET /api/seller/orders` | controllers/orderController.js#adminOrders | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/seller/orders/:id` | controllers/orderController.js#getOrder | Executed | applicationWorkflows.integration.test.js (200, 404) |
| `PUT /api/seller/orders/:id/status` | controllers/orderController.js#updateOrderStatus | Executed | applicationWorkflows.integration.test.js (200) |
| `PUT /api/seller/orders/:id/payment-status` | controllers/orderController.js#updatePaymentStatus | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `PUT /api/seller/orders/:id/shipment` | controllers/orderController.js#updateShipment | Executed | applicationWorkflows.integration.test.js (200) |
| `DELETE /api/seller/orders/:id` | controllers/orderController.js#deleteOrder | Shared handler success via alias | orders.test.js (200) |
| `GET /api/seller/coupons` | controllers/couponController.js#getCoupons | Shared handler success via alias | coupons.test.js, applicationWorkflows.integration.test.js (200) |
| `POST /api/seller/coupons` | controllers/couponController.js#createCoupon | Shared handler success via alias | coupons.test.js, applicationWorkflows.integration.test.js (201, 400, 403, 409) |
| `PUT /api/seller/coupons/:id` | controllers/couponController.js#updateCoupon | Shared handler success via alias | coupons.test.js, applicationWorkflows.integration.test.js (200, 400) |
| `GET /api/seller/categories` | controllers/categoryController.js#getCategories | Executed | release3.test.js (200) |
| `POST /api/seller/categories` | controllers/categoryController.js#createCategory | Shared handler success via alias | applicationWorkflows.integration.test.js, release3.test.js (201, 400) |
| `GET /api/seller/banners` | controllers/bannerController.js#getBanners | Shared handler success via alias | applicationWorkflows.integration.test.js (200, 404) |
| `POST /api/seller/banners` | controllers/bannerController.js#createBanner | Shared handler success via alias | applicationWorkflows.integration.test.js (201) |
| `GET /api/seller/reviews` | controllers/reviewController.js#adminReviews | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/seller/returns` | controllers/returnController.js#adminReturns | Executed | applicationWorkflows.integration.test.js (200) |
| `PUT /api/seller/returns/:id/status` | controllers/returnController.js#updateReturnStatus | Executed | applicationWorkflows.integration.test.js (200, 404) |
| `GET /api/seller/dashboard/stats` | controllers/dashboardController.js#stats | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/seller/reports/sales` | controllers/dashboardController.js#salesReport | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/seller/reports/products` | controllers/dashboardController.js#productReport | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/seller/contact` | controllers/contactController.js#adminList | Shared handler success via alias | applicationWorkflows.integration.test.js, release2.test.js (200) |
| `GET /api/seller/newsletter` | controllers/newsletterController.js#adminList | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/seller/crm` | controllers/crmController.js#list | Executed | applicationWorkflows.integration.test.js (200) |
| `PUT /api/seller/crm/:userId` | controllers/crmController.js#update | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/seller/inbox` | controllers/inboxController.js#list | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/seller/inbox/:id` | controllers/inboxController.js#get | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/seller/inbox/:id/reply` | controllers/inboxController.js#reply | Executed | applicationWorkflows.integration.test.js (201) |
| `PUT /api/seller/inbox/:id/status` | controllers/inboxController.js#updateStatus | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/seller/audit-logs` | controllers/auditController.js#list | Shared handler success via alias | audit.integration.test.js (200) |
| `GET /api/seller/audit-logs/options` | controllers/auditController.js#options | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/seller/audit-logs/:id` | controllers/auditController.js#get | Shared handler success via alias | audit.integration.test.js (200) |
| `GET /api/seller/analytics/funnel` | controllers/analyticsController.js#funnel | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/seller/uploads` | inline handler | Executed | uploads.integration.test.js (201) |
| `POST /api/seller/uploads/videos` | inline handler | Executed | uploads.integration.test.js (201) |
| `GET /api/seller/instagram` | controllers/instagramController.js#status | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/seller/instagram/connect-url` | controllers/instagramController.js#connectUrl | Executed | leftovers.test.js (200) |
| `GET /api/seller/instagram/media` | controllers/instagramController.js#media | Executed | leftovers.test.js (200) |
| `POST /api/seller/instagram` | controllers/instagramController.js#saveStub | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/seller/shipping/provider` | inline handler | Executed | leftovers.test.js (200) |
| `GET /api/instagram/oauth/callback` | controllers/instagramController.js#oauthCallback | Redirect response exercised | applicationWorkflows.integration.test.js (302) |
| `POST /api/analytics/events` | controllers/analyticsController.js#track | Executed | applicationWorkflows.integration.test.js, release3.test.js (202) |
| `GET /api/products` | controllers/productController.js#getProducts | Executed | applicationWorkflows.integration.test.js, release3.test.js (200, 404) |
| `GET /api/products/:slug` | controllers/productController.js#getProductBySlug | Executed | applicationWorkflows.integration.test.js, productLinks.test.js (200, 404) |
| `GET /api/variant-groups` | controllers/variantGroupController.js#listGroups | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/variant-groups/:id` | controllers/variantGroupController.js#getGroup | Executed | applicationWorkflows.integration.test.js (200, 404) |
| `POST /api/variant-groups` | controllers/variantGroupController.js#createGroup | Shared handler success via alias | applicationWorkflows.integration.test.js (201, 400) |
| `PUT /api/variant-groups/:id` | controllers/variantGroupController.js#updateGroup | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `DELETE /api/variant-groups/:id` | controllers/variantGroupController.js#deleteGroup | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `POST /api/variant-groups/:id/add-products` | controllers/variantGroupController.js#addProducts | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `POST /api/variant-groups/:id/remove-products` | controllers/variantGroupController.js#removeProducts | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/categories` | controllers/categoryController.js#getCategories | Executed | applicationWorkflows.integration.test.js (200, 404) |
| `POST /api/categories/admin/create` | controllers/categoryController.js#createCategory | Shared handler success via alias | applicationWorkflows.integration.test.js, release3.test.js (201, 400) |
| `PUT /api/categories/admin/:id` | controllers/categoryController.js#updateCategory | Shared handler success via alias | applicationWorkflows.integration.test.js (200, 400) |
| `DELETE /api/categories/admin/:id` | controllers/categoryController.js#deleteCategory | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/categories/:id` | controllers/categoryController.js#getCategoryById | Shared handler success via alias | applicationWorkflows.integration.test.js (200, 400, 404) |
| `POST /api/categories` | controllers/categoryController.js#createCategory | Shared handler success via alias | applicationWorkflows.integration.test.js, release3.test.js (201, 400) |
| `PUT /api/categories/:id` | controllers/categoryController.js#updateCategory | Shared handler success via alias | applicationWorkflows.integration.test.js (200, 400) |
| `DELETE /api/categories/:id` | controllers/categoryController.js#deleteCategory | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/cart` | controllers/cartController.js#getCart | Executed | leftovers.test.js, applicationWorkflows.integration.test.js (200) |
| `POST /api/cart` | controllers/cartController.js#addToCart | Executed | applicationWorkflows.integration.test.js, cart.test.js, leftovers.test.js (201, 401, 404, 409) |
| `POST /api/cart/selection` | controllers/cartController.js#selectCartItems | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/cart/remove-items` | controllers/cartController.js#removeCartItems | Executed | applicationWorkflows.integration.test.js (200) |
| `PUT /api/cart/:itemId` | controllers/cartController.js#updateCartItem | Executed | applicationWorkflows.integration.test.js (200) |
| `DELETE /api/cart/:itemId` | controllers/cartController.js#removeCartItem | Executed | applicationWorkflows.integration.test.js (200) |
| `DELETE /api/cart` | controllers/cartController.js#clearCart | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/user/addresses` | inline handler | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/user/addresses` | inline handler | Executed | applicationWorkflows.integration.test.js (201) |
| `PUT /api/user/addresses/:addressId` | inline handler | Executed | applicationWorkflows.integration.test.js (200) |
| `DELETE /api/user/addresses/:addressId` | inline handler | Executed | applicationWorkflows.integration.test.js (200) |
| `PATCH /api/user/addresses/:addressId/default` | inline handler | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/wishlist/resolve` | controllers/wishlistController.js#resolveWishlist | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/wishlist` | controllers/wishlistController.js#getWishlist | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/wishlist/:productId` | controllers/wishlistController.js#addWishlist | Executed | applicationWorkflows.integration.test.js (200) |
| `DELETE /api/wishlist/:productId` | controllers/wishlistController.js#removeWishlist | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/orders` | controllers/orderController.js#createOrder | Executed | paymentSettings.test.js, applicationWorkflows.integration.test.js (201, 400) |
| `POST /api/orders/cod` | controllers/orderController.js#createCodOrder | Executed | applicationWorkflows.integration.test.js, returns.test.js, coupons.test.js, orders.test.js, paymentSettings.test.js, release2.test.js, release3.test.js, reviews.test.js, variants.test.js (201, 400, 403, 409) |
| `POST /api/orders/quote` | controllers/orderController.js#quoteOrder | Executed | applicationWorkflows.integration.test.js, orders.test.js, paymentSettings.test.js (200) |
| `GET /api/orders` | controllers/orderController.js#adminOrders | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/orders/:id/receipt` | controllers/orderController.js#receipt | Executed | applicationWorkflows.integration.test.js (200) |
| `PUT /api/orders/:id/status` | controllers/orderController.js#updateOrderStatus | Shared handler success via alias | applicationWorkflows.integration.test.js, returns.test.js, orders.test.js, reviews.test.js (200) |
| `PUT /api/orders/:id/payment-status` | controllers/orderController.js#updatePaymentStatus | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `PUT /api/orders/:id/shipment` | controllers/orderController.js#updateShipment | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `DELETE /api/orders/:id` | controllers/orderController.js#deleteOrder | Shared handler success via alias | orders.test.js (200) |
| `POST /api/orders/:id/cancel` | controllers/orderController.js#cancelOrder | Executed | orders.test.js (200, 403, 409) |
| `GET /api/orders/my-orders` | controllers/orderController.js#myOrders | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/orders/admin/all` | controllers/orderController.js#adminOrders | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/orders/admin/:id` | controllers/orderController.js#getOrder | Shared handler success via alias | applicationWorkflows.integration.test.js, orders.test.js (200, 403, 404) |
| `GET /api/orders/admin/:id/receipt` | controllers/orderController.js#receipt | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `PUT /api/orders/admin/:id/status` | controllers/orderController.js#updateOrderStatus | Shared handler success via alias | applicationWorkflows.integration.test.js, returns.test.js, orders.test.js, reviews.test.js (200) |
| `PUT /api/orders/admin/:id/payment-status` | controllers/orderController.js#updatePaymentStatus | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/orders/:id` | controllers/orderController.js#getOrder | Executed | applicationWorkflows.integration.test.js, orders.test.js (200, 403) |
| `POST /api/payments/create-order` | inline handler | Executed | payments.test.js (200, 409) |
| `POST /api/payments/verify` | inline handler | Executed | payments.test.js (200, 400, 404) |
| `POST /api/payments/failure` | inline handler | Executed | payments.test.js (202, 409) |
| `POST /api/create-order` | inline handler | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/verify-payment` | inline handler | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/coupons` | controllers/couponController.js#getCoupons | Executed | coupons.test.js, applicationWorkflows.integration.test.js (200) |
| `POST /api/coupons/available` | controllers/couponController.js#getAvailableCoupons | Executed | coupons.test.js, applicationWorkflows.integration.test.js (200) |
| `POST /api/coupons/apply` | controllers/couponController.js#applyCoupon | Executed | coupons.test.js, applicationWorkflows.integration.test.js (200, 400) |
| `POST /api/coupons` | controllers/couponController.js#createCoupon | Shared handler success via alias | coupons.test.js, applicationWorkflows.integration.test.js (201, 400, 403, 409) |
| `PUT /api/coupons/:id` | controllers/couponController.js#updateCoupon | Shared handler success via alias | coupons.test.js, applicationWorkflows.integration.test.js (200, 400) |
| `DELETE /api/coupons/:id` | controllers/couponController.js#deleteCoupon | Shared handler success via alias | coupons.test.js, applicationWorkflows.integration.test.js (200) |
| `POST /api/coupons/admin/create` | controllers/couponController.js#createCoupon | Shared handler success via alias | coupons.test.js, applicationWorkflows.integration.test.js (201, 400, 403, 409) |
| `PUT /api/coupons/admin/:id` | controllers/couponController.js#updateCoupon | Shared handler success via alias | coupons.test.js, applicationWorkflows.integration.test.js (200, 400) |
| `DELETE /api/coupons/admin/:id` | controllers/couponController.js#deleteCoupon | Shared handler success via alias | coupons.test.js, applicationWorkflows.integration.test.js (200) |
| `GET /api/banners` | controllers/bannerController.js#getBanners | Executed | applicationWorkflows.integration.test.js (200, 404) |
| `GET /api/banners/:id` | controllers/bannerController.js#getBannerById | Shared handler success via alias | applicationWorkflows.integration.test.js (200, 400) |
| `POST /api/banners` | controllers/bannerController.js#createBanner | Shared handler success via alias | applicationWorkflows.integration.test.js (201) |
| `PUT /api/banners/:id` | controllers/bannerController.js#updateBanner | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `DELETE /api/banners/:id` | controllers/bannerController.js#deleteBanner | Shared handler success via alias | applicationWorkflows.integration.test.js (200, 404) |
| `GET /api/reviews` | controllers/reviewController.js#adminReviews | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/reviews/admin/all` | controllers/reviewController.js#adminReviews | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `PATCH /api/reviews/admin/:id/visibility` | controllers/reviewController.js#toggleVisibility | Shared handler success via alias | reviews.test.js, applicationWorkflows.integration.test.js (200) |
| `DELETE /api/reviews/admin/:id` | controllers/reviewController.js#deleteReview | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/reviews/featured` | controllers/reviewController.js#featuredReviews | Executed | reviews.test.js, applicationWorkflows.integration.test.js (200) |
| `PATCH /api/reviews/:id/visibility` | controllers/reviewController.js#toggleVisibility | Shared handler success via alias | reviews.test.js, applicationWorkflows.integration.test.js (200) |
| `DELETE /api/reviews/:id` | controllers/reviewController.js#deleteReview | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/reviews/:productId/summary` | controllers/reviewController.js#getReviewSummary | Executed | reviews.test.js (200) |
| `GET /api/reviews/:productId/eligibility` | controllers/reviewController.js#getReviewEligibility | Executed | reviews.test.js (200) |
| `POST /api/reviews/:id/helpful` | controllers/reviewController.js#toggleHelpful | Executed | reviews.test.js (200, 403) |
| `POST /api/reviews/:productId` | controllers/reviewController.js#createReview | Executed | applicationWorkflows.integration.test.js, reviews.test.js (201, 403, 409) |
| `GET /api/reviews/:productId/mine` | controllers/reviewController.js#getMyReview | Executed | applicationWorkflows.integration.test.js (200) |
| `PUT /api/reviews/:id` | controllers/reviewController.js#updateReview | Executed | applicationWorkflows.integration.test.js, reviews.test.js (200, 400, 403) |
| `GET /api/reviews/:productId` | controllers/reviewController.js#getReviews | Executed | reviews.test.js (200) |
| `POST /api/returns` | controllers/returnController.js#createReturn | Executed | applicationWorkflows.integration.test.js, returns.test.js (201, 400) |
| `GET /api/returns` | controllers/returnController.js#adminReturns | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/returns/my-requests` | controllers/returnController.js#myReturns | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/returns/order/:orderId` | controllers/returnController.js#orderReturns | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/returns/admin/all` | controllers/returnController.js#adminReturns | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `PUT /api/returns/admin/:id/status` | controllers/returnController.js#updateReturnStatus | Shared handler success via alias | applicationWorkflows.integration.test.js, returns.test.js (200, 404) |
| `PUT /api/returns/:id/status` | controllers/returnController.js#updateReturnStatus | Shared handler success via alias | applicationWorkflows.integration.test.js, returns.test.js (200, 404) |
| `GET /api/settings` | controllers/settingsController.js#getSettings | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/settings/payment-methods` | controllers/settingsController.js#getPaymentMethods | Executed | paymentSettings.test.js (200) |
| `GET /api/settings/payment-readiness` | controllers/settingsController.js#getPaymentReadiness | Shared handler success via alias | paymentSettings.test.js (200) |
| `PUT /api/settings` | controllers/settingsController.js#updateSettings | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `PUT /api/settings/admin/update` | controllers/settingsController.js#updateSettings | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/website-config` | controllers/websiteCustomizationController.js#getActiveConfig | Executed | websiteCustomization.test.js, applicationWorkflows.integration.test.js, real-frontend-browser-journeys (200, 304) |
| `POST /api/contact` | controllers/contactController.js#createMessage | Executed | applicationWorkflows.integration.test.js, release2.test.js (201) |
| `GET /api/contact` | controllers/contactController.js#adminList | Shared handler success via alias | applicationWorkflows.integration.test.js, release2.test.js (200) |
| `PUT /api/contact/:id/status` | controllers/contactController.js#updateStatus | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `POST /api/newsletter/subscribe` | controllers/newsletterController.js#subscribe | Executed | applicationWorkflows.integration.test.js, release2.test.js (200, 201) |
| `POST /api/newsletter/unsubscribe` | controllers/newsletterController.js#unsubscribe | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/newsletter` | controllers/newsletterController.js#adminList | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/notifications` | controllers/notificationController.js#myNotifications | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /api/notifications/summary` | controllers/notificationController.js#summary | Executed | applicationWorkflows.integration.test.js (200) |
| `PATCH /api/notifications/read-all` | controllers/notificationController.js#markAllRead | Executed | applicationWorkflows.integration.test.js (200) |
| `PATCH /api/notifications/:id/read` | controllers/notificationController.js#markRead | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/admin/contact` | controllers/contactController.js#createMessage | Shared handler success via alias | applicationWorkflows.integration.test.js, release2.test.js (201) |
| `GET /api/admin/contact` | controllers/contactController.js#adminList | Executed | applicationWorkflows.integration.test.js, release2.test.js (200) |
| `PUT /api/admin/contact/:id/status` | controllers/contactController.js#updateStatus | Executed | applicationWorkflows.integration.test.js (200) |
| `POST /api/admin/newsletter/subscribe` | controllers/newsletterController.js#subscribe | Shared handler success via alias | applicationWorkflows.integration.test.js, release2.test.js (200, 201) |
| `POST /api/admin/newsletter/unsubscribe` | controllers/newsletterController.js#unsubscribe | Shared handler success via alias | applicationWorkflows.integration.test.js (200) |
| `GET /api/admin/newsletter` | controllers/newsletterController.js#adminList | Executed | applicationWorkflows.integration.test.js (200) |
| `GET /robots.txt` | controllers/seoController.js#robots | Executed | release3.test.js (200) |
| `GET /sitemap.xml` | controllers/seoController.js#sitemap | Executed | leftovers.test.js, release3.test.js (200) |
| `GET /share/product/:slug` | controllers/seoController.js#productShare | Executed | leftovers.test.js (200) |

## External verification limits

Live database connectivity was verified read-only. Razorpay completion in tests uses signed fixture responses; live charges and refunds were not made. No SMS/email/social messages were sent and no public post was created. Real Meta login/publishing requires app credentials and callback setup; live gateway webhooks require the webhook secret and reachable endpoint. Mock email, disabled shipping and configured-but-unexercised provider keys are reported as integration limits, never as successful live provider tests. Browser evidence uses the real built frontend against the isolated API on 57100, with fixture-only customers/orders and mocked delivery/payment.
