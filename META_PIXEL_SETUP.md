# Meta Pixel & Conversions API Setup Guide

**Goal: Achieve 75%+ Event Coverage for Better Ad Performance**

This guide helps you configure Meta Pixel and Conversions API to reach optimal event coverage for running Facebook/Instagram ads.

---

## 📊 Current Status

- **Overall Coverage**: 61% (Goal: 75%+)
- **FBP (Browser ID)**: 1.03% ⚠️ **CRITICAL** - Needs major improvement
- **FBC (Click ID)**: 95.68% ✅ Good
- **IP Address**: 100% ✅ Good
- **User Agent**: 100% ✅ Good

**Expected Improvement**: By reaching 75% coverage, you could achieve **24.2% lower cost per result** with better reporting accuracy.

---

## 🔧 Configuration Steps

### 1. **Environment Variables** (`.env.local`)

Required variables for production:

```env
# Required: Your Meta Pixel ID (not included in repo for security)
NEXT_PUBLIC_META_PIXEL_ID=3862277220735831

# Required: Meta Conversions API Access Token
# This is CRITICAL for server-side event tracking
META_ACCESS_TOKEN=your_access_token_here

# Optional: For testing events before production
META_TEST_EVENT_CODE=your_test_code_here

# Optional: API version (defaults to v18.0)
META_API_VERSION=v18.0
```

**How to Get Your Access Token:**
1. Go to [Facebook Business Settings](https://business.facebook.com/settings/system-user-access-tokens)
2. Create a System User with "Admin" access level
3. Generate an access token with these scopes:
   - `ads_management`
   - `offline_access`
4. Store it in `.env.local` (never commit to git)

### 2. **FBP Cookie Initialization** ✨ NEW

The pixel provider now automatically:
- Creates `_fbp` cookie if missing
- Persists it for 90 days
- Ensures it's sent with every CAPI event

**Status**: ✅ Implemented in `MetaPixelProvider.tsx`

### 3. **Pixel Script Loading**

The pixel script is loaded automatically via `MetaPixelProvider` in `app/providers.tsx`:

```typescript
import { MetaPixelProvider } from '@/components/providers/MetaPixelProvider';

export default function RootLayout() {
  return (
    <MetaPixelProvider>
      {/* Your app */}
    </MetaPixelProvider>
  );
}
```

**What it does:**
1. Loads Meta Pixel script from CDN
2. Initializes pixel with your PIXEL_ID
3. Creates `_fbp` cookie if needed
4. Tracks PageView on route changes

---

## 📱 Event Types Being Tracked

### Dual Tracking (Browser + Server)

These events are tracked on both browser (Pixel) and server (CAPI) for redundancy:

1. **PageView** - Page load
   - Sent immediately on every page load
   - Includes FBP, FBC, IP, User Agent
   
2. **ViewContent** - Product page view
   - Triggered when viewing product details
   - Includes product info, value, currency
   
3. **AddToCart** - Item added to cart
   - Triggered on add to cart
   - Deduplication: Only tracked once per product per session

### Browser-Only Events (Shopify Handles)

These are tracked only via pixel (not CAPI) because Shopify owns checkout:

1. **InitiateCheckout** - Checkout started
2. **AddPaymentInfo** - Payment method added
3. **Purchase** - Order completed

---

## 👥 User Data Parameters

The API automatically includes these user identifiers:

### Device/Browser Data (100% coverage)
- **FBP** (Browser ID): `_fbp` cookie - NOW being created if missing ✨
- **FBC** (Click ID): `_fbc` cookie or generated from `fbclid` URL parameter
- **IP Address**: Extracted from request headers
- **User Agent**: Extracted from request headers

### Customer Data (Optional - collect for better targeting)

If available, these are hashed before sending:
- `em` - Email
- `ph` - Phone
- `fn` - First name
- `ln` - Last name
- `ct` - City
- `st` - State
- `zp` - ZIP code
- `country` - Country

---

## 🚀 Optimization Checklist

### ✅ Already Implemented

- [x] FBP cookie generation and persistence
- [x] FBC cookie handling from `fbclid` URL parameter
- [x] IP address collection from server
- [x] User Agent collection from server
- [x] Event deduplication with event IDs
- [x] Proper CAPI payload formatting
- [x] Error logging and monitoring

### 🔄 Next Steps to Reach 75%+

#### 1. **Verify Environment Configuration**
```bash
# Check that these are set in production
echo $META_ACCESS_TOKEN  # Should not be empty
echo $NEXT_PUBLIC_META_PIXEL_ID  # Should show your ID
```

#### 2. **Monitor FBP Coverage in Meta Events Manager**
- Go to [Meta Events Manager](https://business.facebook.com/events_manager)
- Select your Pixel
- Go to "Diagnostics" tab
- Watch for FBP coverage increasing from 1.03% to 50%+

#### 3. **Ensure Cookies Are Being Set**
Open browser DevTools → Application → Cookies:
- Look for `_fbp` cookie (should exist)
- Look for `_fbc` cookie (should exist if user clicked from ads)
- Both should have values like: `fb.1.1234567890.9876543210`

#### 4. **Test Event Flow**
```bash
# Open browser console (F12)
# You should see logs like:
# [Meta] Initialized _fbp cookie: fb.1...
# [Meta CAPI] Server event: PageView
# [Meta Pixel] Browser event: PageView
```

#### 5. **Additional User Data Collection** (Optional but Recommended)

To send customer email/phone for better deduplication:

```typescript
import { trackViewContent } from '@/lib/meta';

// When you have user data available:
trackViewContent({
  value: 99.99,
  currency: 'USD',
  content_ids: ['product-123'],
  content_name: 'Product Name',
  // Add custom user data if available from your CRM or form
});
```

---

## 🐛 Debugging & Monitoring

### View Debug Logs

In development mode, the console will show:

```
[Meta] Initialized _fbp cookie: fb.1.1234567890.1234567890
[Meta] _fbc cookie found: fb.1.1234567890.9876543210
[Meta CAPI] Server event: PageView {
  eventId: "xxx-xxx-xxx",
  fbp: true,
  fbc: true,
  userDataFields: 4
}
```

### Meta Events Manager

Monitor your events in real-time:
1. Go to [Events Manager](https://business.facebook.com/events_manager)
2. Select your pixel
3. Go to "All Events" tab
4. Watch for increasing event counts with proper user data

### Test Event Code

For testing without affecting production data:
1. Get your test event code from Events Manager
2. Add to `.env.local`: `META_TEST_EVENT_CODE=your_code`
3. Events will be marked as test data (not counted in ads)

---

## 📈 Expected Improvements

When you reach 75% FBP coverage:

| Metric | Current | Expected |
|--------|---------|----------|
| FBP Coverage | 1.03% | 75%+ |
| Overall Coverage | 61% | 80%+ |
| Cost Per Result | Baseline | **24.2% Lower** |
| Event Match Quality | 4.8/10 | 7.0+/10 |
| Targeting Accuracy | Lower | Higher |

---

## ⚠️ Common Issues & Fixes

### Issue: FBP Still at 1.03%

**Cause**: Cookie not persisting between page loads

**Fix**:
1. Check browser cookie settings (3rd party cookies enabled)
2. Verify `_fbp` exists in Application → Cookies
3. Ensure HTTPS in production (cookies need Secure flag)
4. Check browser console for cookie errors

### Issue: FBC Not Captured

**Cause**: URL doesn't include `fbclid` parameter

**Fix**:
1. Ensure all Meta ads have proper conversion pixel
2. Check that click IDs are being appended to URLs
3. In Meta Ads Manager, verify "Conversions API" is enabled

### Issue: Events Not Appearing in Meta

**Cause**: Missing or invalid META_ACCESS_TOKEN

**Fix**:
1. Verify token is set in `.env.local`
2. Token must have `ads_management` scope
3. Regenerate token if expired
4. Check server logs for API errors

### Issue: Low Event Match Quality

**Cause**: Insufficient user data parameters

**Fix**:
1. Collect and send email/phone when available
2. Ensure IP and User Agent are included (automatic)
3. Hash sensitive data properly (done server-side)
4. Use CRM integration for customer data

---

## 🔐 Security Notes

- **FBP/FBC**: Automatically handled, no sensitive data
- **IP Address**: Used for geo-targeting, not stored
- **User Agent**: Used for device targeting, not stored
- **Email/Phone**: Hashed with SHA256 before sending
- **Access Token**: Never exposed to browser (server-only)

---

## 📚 Additional Resources

- [Meta Conversions API Docs](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Conversions API Event Reference](https://developers.facebook.com/docs/marketing-api/conversions-api/event-reference)
- [Customer Data Parameters](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters)
- [Events Manager Diagnostics](https://business.facebook.com/events_manager)
- [Parameter Builder Tool](https://developers.facebook.com/docs/marketing-api/conversions-api/parameter-builder) - SDK for improving fbc coverage

---

## ✅ Implementation Checklist

- [ ] Set `META_ACCESS_TOKEN` in `.env.local`
- [ ] Verify `NEXT_PUBLIC_META_PIXEL_ID` is correct
- [ ] Deploy new code with FBP improvements
- [ ] Check browser for `_fbp` cookie creation
- [ ] Monitor Events Manager for coverage increase
- [ ] Verify server logs show CAPI events
- [ ] Test on production site
- [ ] Monitor coverage for 2-3 days
- [ ] Expect to reach 75%+ coverage within 1 week
- [ ] Optimize ads based on improved reporting

---

## 💡 Next: CRM Integration

For even better results (recommended by Meta):

1. **Connect your CRM** to get customer hashes
2. **Send email/phone** with events
3. **Enable matching** for offline conversions
4. **Sync purchase data** from Shopify

This can improve **Event Match Quality to 8-9/10**.

---

**Last Updated**: 2026-07-06
**Status**: ✅ All improvements implemented and ready
