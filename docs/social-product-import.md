# Instagram and Facebook product imports

Open **Admin → Import social link**, also available from Products, Quick Add and Product Drafts on desktop and mobile.

1. Paste an Instagram post/carousel/reel URL or Facebook photo/post/video/reel URL.
2. Follow processing progress or return later through import history. Failed imports can be retried; pending work can be cancelled.
3. Review the recommended photos and prefilled details. A missing-essentials summary identifies what still needs your input; descriptions and optional fields are collapsed but editable. Including the original reel is optional.
4. Enter your actual stock and any remaining required details, then choose **Publish product** directly on the import screen. **Save for later** preserves a draft that resumes on the same screen. Importing alone never publishes. Published products have an **Edit product** link.

## Smart context and price autofill

Caption autofill works without AI: it fills stated names, materials, colours and sizes, matches recognizable names to existing categories, and distinguishes a stated selling price from MRP and delivery fees. Starting prices, ranges, instalments, bundle offers and conflicting prices are left for confirmation. Stock is never inferred.

With a configured `GEMINI_API_KEY`, the importer sends the post caption, selected photos and a compressed copy of available reels to Gemini. The copy retains audio, allowing the service to use speech and on-screen text in addition to product appearance. It asks for Hindi, Hinglish and English context, source-supported fabric/sizes/measurements and a concise catalog description. Prices require an explicit INR amount, a supporting excerpt containing that amount, and no multi-product or pricing ambiguity. The review shows where the price came from; every suggestion remains editable.

Context copies use up to 640-pixel frames at two frames per second with mono audio, up to five minutes per video. Each copy is capped at 12 MiB, combined video input at 13 MiB, and combined media at 14 MiB before base64 encoding. Oversized additional clips are skipped with a review warning; originals are preserved. Temporary context files are deleted. Context requests share a 60-second provider timeout across bounded model attempts. The configured model is tried first, with `gemini-flash-latest` and `gemini-flash-lite-latest` as fallbacks for retired or temporarily overloaded models. The working model and unavailable versions are remembered for 15 minutes, separately for the effective key/model configuration. No `.env` values are rewritten. Photo-only analysis and optional frame-view classification use the same fallback logic.

Errors distinguish unavailable models, exhausted quota, denied access, connection/timeouts, incomplete responses and media preparation failures. Quota/access failures do not trigger extra model requests. A failed Smart Fill refresh preserves previous suggestions, manual edits and saved drafts. Bulk Smart Fill stops on account/service failures and shows the actual explanation instead of asking for clearer photos.

Sized products still require the store's existing size-chart measurements. The import screen includes these controls, plus configured required product attributes, so completing them does not require visiting Product Drafts. Measurements are only suggested when stated by the source. Repeated publication reuses the same product. Saved social reviews carry a revision timestamp so an older screen cannot overwrite subsequent draft edits; photos added in the draft editor are retained.

For uploaded reels, a successful whole-video analysis identifying a single product keeps its views in one review group (up to 20 photos), instead of treating each few frames as another product. Uncertain/multi-product clips retain provisional review groups. **Smart fill all products** also works on saved unpublished candidates. It reads the original reel where available, fills stated prices, and preserves manual edits. **Publish selected products** saves and publishes directly from reel review using the same catalog validation. Published candidates link to the regular product editor.

## When Smart Reel Assistant is disabled

The capability check uses the backend's effective `GEMINI_API_KEY`. A blank key disables AI even when media storage and frame extraction work. Add a valid key to the existing entry in `backend/.env`, restart the backend yourself, then use **Check setup again** in reel review. This checks whether the running backend sees a configured key; an actual analysis also verifies provider access and available quota. Keys remain on the backend. No existing `.env` values were changed by this implementation.

Gemini offers free API access to eligible models with usage limits and a separate usage-billed paid tier. Usage follows the selected model and the Google project's billing tier; this application does not enable billing. See [Google's current pricing](https://ai.google.dev/gemini-api/docs/pricing) and [video input documentation](https://ai.google.dev/gemini-api/docs/video-understanding).

## What the importer can retrieve

The backend first attempts optional official connected-account access, then accessible public page metadata. It saves retrieved media into catalog storage rather than retaining expiring Meta CDN links. It supports up to 20 photos, up to three videos per post, and up to 12 quality-selected stills per video within the same 20-photo limit, with up to six recommended automatically. Each video must be an MP4 no larger than 80 MB or five minutes; individual source photos are limited to 12 MB. JPEG, PNG and WebP photos are converted to WebP, bounded to 1600 pixels.

## Choosing clear video photos

Both social-link videos and the bundled local uploaded-reel processor use the same quality selector. It scans up to 180 moments across the entire clip (up to three per second), measures centre-weighted sharpness and exposure, rejects very blurry/dark/overexposed frames, and removes visually similar frames while retaining colour differences. It chooses varied views and uses a framing hint to favour a wider, clear cover over a tightly cropped detail. Quality numbers are heuristic image measurements, not a promise of product accuracy or an AI confidence percentage.

The uploaded-reel fallback retains up to 24 photos in review groups, or up to 20 when whole-video context identifies a single product. Grouping remains reviewable: merge or split candidates if one garment spans several groups or several garments share a group. The external `AI_VIDEO_WORKER_URL` integration keeps its own initial frame-selection implementation; manual Smart Fill uses the shared context service.

When `GEMINI_API_KEY` is configured, a further image review suggests front/back/side/detail views and discourages obstructed or heavily overlaid frames. Without that key, clarity filtering and recommendations still work locally; view labels remain for you to confirm. Photos are extracted from the actual video, preserve its proportions and are not enlarged beyond the source resolution. The system cannot recover detail absent from a blurry recording or supply a view that the video never shows.

Use **Use recommended photos**, inspect full-size images, confirm the view labels and set the cover. Alternative clear photos remain available. An unsaved social video import can use **Recheck video photos** to run selection again; that action replaces the unsaved review. Existing saved drafts/products are never replaced by a recheck.

Selected image URLs, cover choice, frame timestamps, quality measurements and confirmed view labels survive draft creation and publication. Use **Edit published product** from the draft or the catalog editor to change photos, labels, product details, price and stock. Product galleries support 20 saved images; manual uploads accept up to eight new images per batch. The uploader preserves exactly one main photo after removals.

Implementation references: [FFmpeg frame selection](https://ffmpeg.org/ffmpeg-filters.html#select_002c-aselect), [Gemini image understanding](https://ai.google.dev/gemini-api/docs/image-understanding).

Caption and optional Gemini context supply reviewable details. Stock is never inferred; ambiguous or missing prices remain blank. Social posts with several products require selecting media for one listing and confirming its commercial details. Social imports do not automatically publish or split several products from one post.

Meta does not expose every public post's complete caption, carousel or reel file to unauthenticated servers. Login-restricted, private, expired, unsupported or blocked links can fail even when they work in your signed-in browser. A successful public import may expose only the cover photo. The UI explains this and links to the existing photo and reel upload tools. There is no password collection, cookie extraction, private-content bypass or claim of universal link access.

## Server configuration

Use the existing `backend/.env` mechanism; never place access tokens in frontend variables. New placeholders are documented in `backend/.env.example`.

- **Media:** configure existing R2 or Cloudinary storage. Production imports are disabled without permanent storage; development can use local `/uploads` files. Existing bundled ffmpeg/ffprobe perform conversion and frame extraction.
- **Optional context suggestions:** set `GEMINI_API_KEY` and the existing `GEMINI_MODEL` to a model available to your account. Caption extraction and media importing still work without AI. The capabilities endpoint and UI disclose when AI is unavailable; provider errors distinguish denied access and exhausted quota.
- **Optional Instagram:** set `SOCIAL_IMPORT_INSTAGRAM_ACCESS_TOKEN` to an Instagram Login professional-account token with the required media-reading permissions, and `SOCIAL_IMPORT_INSTAGRAM_ACCOUNT_ID` to its account ID (or `me`). This reads media belonging to that authorized account, checking up to its latest 500 posts. Existing store-scoped Instagram connections are also understood by the resolver, but this release mounts the importer in the global admin workspace.
- **Optional Facebook:** set `SOCIAL_IMPORT_FACEBOOK_PAGE_TOKEN` to an authorized Page access token with the applicable Page/media-reading permissions. It can read accessible numeric photo/video/post IDs belonging to that Page. Shared/opaque links can still require public resolution or manual upload.
- **API version:** `SOCIAL_IMPORT_GRAPH_VERSION` defaults to `v25.0`. Token lifecycle and app review/permissions remain managed in your Meta app. No OAuth onboarding screen is added by this feature.

Official platform reference: [Meta's Instagram API documentation](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api).

The application server must be running for imports to process. These changes do not start it automatically.

## Persistence, authorization and recovery

All `/api/admin/social-imports` endpoints require an authenticated admin and scope imports to their creator. History is paginated. Requests are rate limited; each user may have five outstanding imports. Import records and progress are persisted in MongoDB, with serial in-process processing. Repeated canonical URLs reuse the user's existing import. Creating a draft and publishing a social draft use unique source references to avoid duplicate records on retries or concurrent requests.

Queued work resumes when the backend reconnects. Interrupted processing older than eight minutes is marked retryable; recovery runs every two minutes. Jobs have a six-minute processing timeout and at most five attempts. Cancelling prevents later processing results from changing that job, though an upload already accepted by a storage provider may finish. Temporary processing directories are removed. Persisted media retained by cancelled/failed imports is not automatically purged; plan normal storage retention separately.

Source requests allow only Instagram/Facebook hosts and approved Meta media CDNs, validate each redirect, pin validated public DNS addresses, bound response sizes and timeouts, and reject HTML/SVG disguised as images. Draft creation accepts image IDs from the owned import, not arbitrary submitted image URLs.

## Verification

```
node --test backend/tests/socialImport.unit.test.js
node --test backend/tests/socialImport.integration.test.js
node --test backend/tests/productFrameSelection.test.js backend/tests/productFrameVision.test.js backend/tests/localReelQuality.test.js
node --test backend/tests/productImportContext.test.js
node --test backend/tests/geminiJson.test.js backend/tests/reelCandidateVision.unit.test.js
npm test -- --watchAll=false --runInBand --runTestsByPath src/pages/admin/SocialProductImport.test.jsx src/pages/admin/ReelProductImport.test.jsx src/components/admin/ImageUploader.test.jsx
npm run build
```

The integration suite starts its own isolated MongoDB and ephemeral test HTTP listener, then closes both. It does not load `backend/.env` or contact the application database. It tests real authentication, media conversion, storage, draft persistence and publication, with fixture Meta responses. Live account access depends on configured credentials and source availability; fixture tests do not establish that a particular live post is importable.

The frame tests use real encoded videos to check blur, darkness, duplicate removal and late product appearances beyond the first 48 seconds. Integration checks cover selected covers and view labels through draft creation, publishing and subsequent product edits, including protection of saved drafts against rechecks. Automated AI tests use fixture responses. A separate live check using only a made-up product caption reproduced retired-model 404s and temporary overload, then successfully extracted the name and stated price through the Flash Lite fallback. No saved reel or customer media was sent for that check.

The actual admin layout, social import review and uploaded-reel review were also rendered with local fixture data in an isolated headless browser at 390, 768 and 1600 pixel viewport widths. All three showed no document-level horizontal overflow. A real local product clip was inspected separately to verify that the suggested cover and detail photos came from the original video. The application server was not started during verification. The production build completed with the existing pdfmake source-map warning.
