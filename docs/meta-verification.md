# Meta Tracking Verification Checklist

Follow these steps to verify Meta Pixel + Conversions API tracking and deduplication.

## Prerequisites
- `NEXT_PUBLIC_META_PIXEL_ID=3862277220735831` set in `.env`
- `META_ACCESS_TOKEN` set in `.env` (server-side only)
- If using Meta Test Events, set `META_TEST_EVENT_CODE` in `.env` (e.g. `TEST8208`)
- Disable ad blockers in your browser
- Open the site in an incognito window if you need fresh cookies

## 1. Open Meta Events Manager
1. Go to Meta Ads Manager → Events Manager
2. Select the pixel with ID `3862277220735831`
3. Open the **Test Events** tab

## 2. Visit homepage
1. Load your storefront home page
2. Expected in Test Events:
   - `PageView` (Browser)
   - `PageView` (Server)
3. Confirm both events share the same `event_id`

## 3. Visit a product page
1. Open any product page
2. Expected in Test Events:
   - `ViewContent` (Browser)
   - `ViewContent` (Server)
3. Confirm both events share the same `event_id`
4. Confirm `content_ids`, `content_name`, `value`, and `currency` are present on the server event

## 4. Add product to cart
1. Add a product to cart (use a real add-to-cart flow)
2. Expected in Test Events:
   - `AddToCart` (Browser)
   - `AddToCart` (Server)
3. Confirm both events share the same `event_id`

## 5. Checkout initiation
1. Click the checkout button
2. Expected in Test Events:
   - `InitiateCheckout` (Browser ONLY)
3. DO NOT expect server-side `InitiateCheckout`, `AddPaymentInfo`, or `Purchase` from your app; Shopify handles these.
4. Confirm Shopify sends Purchase events after checkout completes (outside this app)

## 6. Deduplication validation
- For each user action, browser + server events must have IDENTICAL `event_id`
- Meta should count one unique event per action (deduplicated)

## 7. Test Event Code (optional)
- If `META_TEST_EVENT_CODE` is set, the Conversions API requests will include `test_event_code` allowing direct validation in Test Events.

## 8. Troubleshooting
- No server event received:
  - Check server logs for `[Meta CAPI]` messages
  - Ensure `META_ACCESS_TOKEN` is valid
  - Ensure `/api/meta/events` returns 200
- Missing `fbp`/`fbc` in server event:
  - These cookies may not exist on first visit
  - Check browser DevTools → Application → Cookies for `_fbp` and `_fbc`
- Duplicate events:
  - Verify `event_id` values are equal across browser + server
  - Verify MetaPixelProvider is mounted once and PageView is only fired once per navigation

## 9. Success Criteria
- Matching `event_id` for Browser + Server on PageView, ViewContent, AddToCart
- Meta Test Events shows both Browser + Server events for each action
- No duplicate `Purchase` or server-side `InitiateCheckout` events originating from the app
- Clean TypeScript build and no lint errors related to the new files

## 10. Notes
- Development logging is enabled when `NODE_ENV === 'development'` to help debugging.
- The server API extracts `client_ip_address` and `client_user_agent` from request headers and includes them in CAPI events when available.

**End of checklist**
