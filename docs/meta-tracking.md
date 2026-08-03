# Meta Pixel + Conversions API Tracking Implementation

## Overview

This document outlines the complete Meta Pixel and Meta Conversions API (CAPI) implementation for Brady Legler's Next.js storefront. The tracking is designed to provide complete visibility into customer journey while avoiding duplicate events and respecting Shopify's ownership of checkout and purchase tracking.

## Architecture

### Components

1. **`lib/meta.ts`** - Core tracking module
   - UUID event_id generation for deduplication
   - Browser event firing via Meta Pixel SDK
   - Server-side Conversions API event sending
   - User data collection (FBP, FBC cookies)

2. **`components/providers/MetaPixelProvider.tsx`** - Client-side provider
   - Loads Meta Pixel SDK
   - Initializes pixel with ID
   - Automatically tracks PageView on route changes (Next.js App Router)
   - Provides global tracking context

3. **`app/api/meta/events/route.ts`** - API endpoint
   - Receives events from browser
   - Validates required fields
   - Forwards to Meta Conversions API
   - Handles errors and logging

### Event Flow

```
┌─────────────────────────────────────────┐
│ Browser Event (Meta Pixel)              │
│ fbq('track', eventName, data)           │
├─────────────────────────────────────────┤
│ Generates UUID event_id                 │
├─────────────────────────────────────────┤
│ POST /api/meta/events                   │
├─────────────────────────────────────────┤
│ Conversions API                         │
│ Same event_id prevents deduplication    │
└─────────────────────────────────────────┘
```

## Tracked Events

### Storefront Events (Implemented in Next.js)

#### 1. PageView
**When:** Page loads or route changes
**Triggered by:** MetaPixelProvider on pathname change
**Data:** None (automatic)

```typescript
trackPageView()
```

#### 2. ViewContent
**When:** User views a product page
**Where:** Product page component
**Data Required:**
- `content_ids`: [productId]
- `content_name`: Product title
- `value`: Price (as number)
- `currency`: Currency code (USD, EUR, etc.)

```typescript
trackViewContent({
  content_ids: [productId],
  content_name: productTitle,
  value: productPrice,
  currency: 'USD'
})
```

#### 3. AddToCart
**When:** User successfully adds item to cart
**Where:** Add to cart button click handler
**Data Required:**
- `content_ids`: [productId]
- `content_name`: Product title
- `value`: Price (as number)
- `currency`: Currency code

```typescript
trackAddToCart({
  content_ids: [productId],
  content_name: productTitle,
  value: productPrice,
  currency: 'USD'
})
```

### Shopify-Owned Events (NOT Implemented)

The following events are **entirely handled by Shopify** through its native Meta integration:

- **InitiateCheckout**: Shopify sends this when checkout begins
- **AddPaymentInfo**: Shopify sends when payment method is added
- **Purchase**: Shopify sends this for completed orders

**Why not duplicate them:**
1. Shopify owns the checkout experience
2. Shopify has Meta integration enabled with Maximum Data Sharing
3. Duplicate events create data quality issues
4. Shopify's native tracking is more accurate

### InitiateCheckout (Browser Only)

For the checkout button, send **browser-only** InitiateCheckout event:

```typescript
import { trackInitiateCheckout } from '@/lib/meta'

// In checkout button click handler:
function handleCheckoutClick() {
  // Track browser event only (Shopify will handle checkout)
  trackInitiateCheckout()
  
  // Redirect to Shopify checkout
  window.location.href = checkoutUrl
}
```

This sends the browser event but **NOT** the server-side CAPI event because Shopify's native integration will send the CAPI event.

## Environment Configuration

Required variables in `.env`:

```bash
# Meta Pixel ID
NEXT_PUBLIC_META_PIXEL_ID="3862277220735831"

# Meta Conversions API Access Token
META_ACCESS_TOKEN="EAAcuHVX8XC4BRsgH7r..."
```

Both are already configured in the project.

## Deduplication Strategy

### Event ID Generation

Each tracking call generates a UUID event_id:

```typescript
const eventId = generateEventId() // xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
```

### Same Event ID for Browser + Server

```
Browser Event: fbq('track', 'ViewContent', data, { eventID: eventId })
Server Event:  POST /api/meta/events with event_id: eventId
```

Meta's system recognizes the matching event_id and only counts it once.

### No Duplicate Checkout Events

```
Browser: trackInitiateCheckout()  ✓ (browser event only)
Server:  NOT SENT                  ✗ (Shopify handles)
```

## Implementation Guide

### 1. Product Page View

In your product page component:

```typescript
'use client'

import { useEffect } from 'react'
import { trackViewContent } from '@/lib/meta'

export default function ProductPage({ product }) {
  useEffect(() => {
    // Track product view when component mounts
    trackViewContent({
      content_ids: [product.id],
      content_name: product.title,
      value: product.price,
      currency: product.currency || 'USD'
    })
  }, [product.id])

  return (
    // Product page content
  )
}
```

### 2. Add to Cart

In your cart addition handler:

```typescript
import { trackAddToCart } from '@/lib/meta'

async function handleAddToCart(product) {
  try {
    const response = await addToCart(product.id)
    
    if (response.success) {
      // Track only after successful addition
      trackAddToCart({
        content_ids: [product.id],
        content_name: product.title,
        value: product.price,
        currency: 'USD'
      })
    }
  } catch (error) {
    console.error('Error adding to cart:', error)
  }
}
```

### 3. Checkout Button

In your checkout button:

```typescript
import { trackInitiateCheckout } from '@/lib/meta'

function CheckoutButton({ checkoutUrl }) {
  function handleClick() {
    // Browser event only - Shopify will handle CAPI and downstream events
    trackInitiateCheckout()
    
    // Redirect to Shopify checkout
    window.location.href = checkoutUrl
  }

  return <button onClick={handleClick}>Proceed to Checkout</button>
}
```

## Testing in Meta Test Events

### Access Meta Test Events

1. Go to Meta Ads Manager
2. Events Manager → Test Events
3. Select the pixel (ID: 3862277220735831)
4. View incoming test events

### Expected Event Sequence

#### Product Visit

```
[1] PageView (Browser + Server)
    event_id: a1b2c3d4-...
    
[2] ViewContent (Browser + Server)
    event_id: e5f6g7h8-...
    value: 99.99
    currency: USD
    content_ids: [product-123]
```

#### Add to Cart

```
[3] AddToCart (Browser + Server)
    event_id: i9j0k1l2-...
    value: 99.99
    currency: USD
    content_ids: [product-123]
```

#### Checkout

```
[4] InitiateCheckout (Browser only)
    event_id: m3n4o5p6-...
    
[Shopify handles downstream]
→ AddPaymentInfo (Shopify)
→ Purchase (Shopify)
```

### Verify Deduplication

In Meta Test Events:
- You should see 2 events for each action (browser + server)
- They share the same event_id
- Meta counts them as 1 unique event
- No duplicates in dashboard

## Development Logging

When `NODE_ENV === 'development'`, detailed logs appear in browser console and server logs:

### Browser Logs

```
[Meta Pixel] Browser event: PageView
[Meta Pixel] Browser event: ViewContent {value: 99.99, currency: "USD"}
[Meta CAPI] Server event: ViewContent {...payload...}
```

### Server Logs

```
[Meta CAPI] Sending event to Meta API: {url, event, eventId}
[Meta CAPI] Event sent successfully: {fbl_event_id, ...}
```

This logging is automatically disabled in production.

## User Data Collection

The following user data is collected with every CAPI event:

```typescript
{
  fbp: "_fb.1.234567890.987654321",    // From _fbp cookie
  fbc: "_fbc.1.234567890.987654321",   // From _fbc cookie
  client_ip_address: "192.168.1.1",    // Server-side only
  client_user_agent: "Mozilla/5.0..."  // Server-side only
}
```

This enables:
- Cross-device matching
- Offline attribution
- CAPI advanced matching

## Shopify Integration

### What Shopify Handles

Shopify's native Meta integration (enabled with Maximum Data Sharing):

1. **Checkout page:** Sends InitiateCheckout, AddPaymentInfo
2. **Order confirmation:** Sends Purchase event
3. **All checkout events:** Include full customer + order data
4. **Automatic:** No configuration needed on our side

### Why We Don't Duplicate

- Shopify's checkout data is authoritative
- Shopify has access to actual cart contents, order value, customer ID
- Shopify sends CAPI events with more complete data
- Creating duplicates breaks attribution models

### Our Responsibility

We handle only the storefront funnel:
- PageView (every page)
- ViewContent (product pages)
- AddToCart (cart additions)
- InitiateCheckout button click (trigger, then redirect to Shopify)

## Troubleshooting

### Events Not Appearing in Test Events

1. **Check Pixel ID:** Verify `NEXT_PUBLIC_META_PIXEL_ID` is correct (3862277220735831)
2. **Check Token:** Verify `META_ACCESS_TOKEN` is valid
3. **Check Logs:** Look for `[Meta CAPI]` errors in server logs
4. **Test Events Tab:** Give it 10-15 minutes for events to appear
5. **Ad Blocker:** Disable ad blockers that may block fbq calls

### Duplicate Events in Dashboard

1. **Check event_id:** Same event_id shouldn't appear twice in Test Events
2. **Check initialization:** MetaPixelProvider should only load pixel once
3. **Check routing:** Verify PageView isn't tracked multiple times per navigation

### Missing User Data

If `fbp` and `fbc` are empty in CAPI events:
1. Cookies may not be set yet (first visit)
2. User may have blocked cookies
3. Check browser DevTools → Application → Cookies for `_fbp` and `_fbc`

### 404 on API Endpoint

1. Verify file at `app/api/meta/events/route.ts` exists
2. Check Next.js build logs for errors
3. Verify API endpoint is accessible: `POST /api/meta/events`

## Performance Considerations

### Async Event Sending

Both browser and server events are sent asynchronously:

- Browser: `fbq()` is non-blocking
- Server: `fetch()` to Meta API is async
- Events don't impact page load performance

### Error Handling

Failed events are logged but don't block user actions:

```typescript
try {
  // Send event
} catch (error) {
  console.error('[Meta]', error)
  // Continue without throwing
}
```

## Security

### Token Management

- `META_ACCESS_TOKEN` is server-side only (.env)
- Never exposed to browser
- Can be rotated without code changes
- Consider rotating token quarterly

### API Endpoint Security

The `/api/meta/events` endpoint:
- Accepts POST requests
- Validates required fields
- No authentication required (events are non-sensitive)
- Should have rate limiting in production

## Files Modified/Created

- ✅ `lib/meta.ts` - Core tracking module
- ✅ `components/providers/MetaPixelProvider.tsx` - Pixel loader + PageView
- ✅ `app/api/meta/events/route.ts` - CAPI endpoint
- ✅ `app/providers.tsx` - Added MetaPixelProvider
- ✅ `.env` - Added NEXT_PUBLIC_META_PIXEL_ID
- ✅ `components/Scripts/index.tsx` - Removed old Pixel code
- ✅ `docs/meta-tracking.md` - This file

## Next Steps

1. **Implement in product pages:** Use `trackViewContent()` in ProductPage component
2. **Implement in cart:** Use `trackAddToCart()` in add-to-cart handler
3. **Implement checkout:** Use `trackInitiateCheckout()` in checkout button
4. **Test:** Visit product page and monitor Meta Test Events
5. **Verify:** Ensure events appear with matching event_ids
6. **Monitor:** Watch dashboard over first week of tracking

## References

- [Meta Pixel SDK](https://developers.facebook.com/docs/facebook-pixel)
- [Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Event Deduplication](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplication)
- [Shopify Meta Integration](https://help.shopify.com/en/manual/facebook-app-settings/facebook-marketing)
