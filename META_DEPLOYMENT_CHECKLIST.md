# Meta Pixel Integration - Deployment Checklist

**Objective**: Get from 61% to 75%+ event coverage for optimal ad performance

---

## 📋 Pre-Deployment (Local Testing)

### 1. Install Dependencies
```bash
npm install
# Already included in Next.js
```

### 2. Create `.env.local` with your Meta credentials
```env
NEXT_PUBLIC_META_PIXEL_ID=3862277220735831
META_ACCESS_TOKEN=your_token_here
META_API_VERSION=v18.0
META_TEST_EVENT_CODE=  # Leave empty for production
```

**Getting your Access Token:**
- Go to https://business.facebook.com/settings/system-user-access-tokens
- Create/select a System User
- Generate token with `ads_management` and `offline_access` scopes
- Keep it secure (never commit to git)

### 3. Start Development Server
```bash
npm run dev
# Should see no errors about Meta configuration
```

### 4. Test in Browser
Open `http://localhost:3000` and test:

```javascript
// In browser console (F12):
debugMeta.fullDiagnostic()

// Should show:
// ✓ fbq available: true
// ✓ _fbp cookie: fb.1.1234567890...
// ✓ _fbc cookie: (may be missing if not from ads)
```

### 5. Verify API Connection
```javascript
// In browser console:
await debugMeta.sendTestEvent('PageView')

// Check:
// ✅ Event sent successfully (should see in console)
// Check server logs for: [Meta CAPI] Event sent successfully
```

### 6. Check Server Logs
```bash
# Terminal should show:
# [Meta CAPI] Received event: {
#   eventName: "PageView",
#   eventId: "xxx",
#   fbp: true,  <-- Should be true
#   fbc: false, <-- OK if missing
#   userDataFields: 4
# }
```

---

## 🚀 Deployment to Production

### 1. Update Environment Variables on Netlify/Vercel

**For Netlify:**
1. Go to Site settings → Build & deploy → Environment
2. Add new variables:
   - `NEXT_PUBLIC_META_PIXEL_ID` = `3862277220735831`
   - `META_ACCESS_TOKEN` = your_token
   - `META_API_VERSION` = `v18.0`

**For Vercel:**
1. Go to Project Settings → Environment Variables
2. Add the same variables for Production

### 2. Redeploy Your Site
```bash
# Netlify (auto-deploys from git)
git push origin main

# Or manual Vercel deploy
vercel --prod
```

### 3. Wait for Deployment to Complete
- Monitor deployment logs
- Ensure no build errors
- Check environment variables are applied

---

## ✅ Post-Deployment Verification

### 1. Verify Site is Live
- Visit your production site: https://www.bradylegler.com
- Should load without errors

### 2. Test Cookies are Created
```javascript
// In browser console on production:
document.cookie  // Should include: _fbp=fb.1...
```

### 3. Monitor Events in Meta

**Real-time Monitoring:**
1. Go to https://business.facebook.com/events_manager
2. Select your pixel (3862277220735831)
3. Go to "Test Events" tab
4. You should see incoming PageView events

**Check Diagnostics:**
1. In Events Manager, go to "Diagnostics"
2. Look for your events under PageView
3. Watch FBP coverage increase (should go from 1.03% → 50%+)

### 4. Generate Test Traffic
To accelerate coverage improvement, send test traffic:
- Visit your site from different browsers
- Load multiple pages
- Click on products
- Each visit = 1 PageView event

**Expected**: After ~50 visitors, FBP coverage should be 20%+

### 5. Verify Ads are Connected
In Meta Ads Manager:
1. Go to campaigns
2. Verify pixel is connected to ad sets
3. Check if PageView event is selected as objective

---

## 📊 Expected Timeline

| Day | FBP Coverage | Overall Coverage | Status |
|-----|-------------|------------------|--------|
| Day 0 (Today) | 1.03% | 61% | ⚠️ Before fix |
| Day 1-2 | 10-20% | 65-70% | 📈 Improving |
| Day 3-5 | 30-50% | 70-75% | 📈 Good progress |
| Day 7+ | 50-75% | 75%+ | ✅ Target reached |

---

## 🔍 Troubleshooting

### Problem: FBP Still at 1.03%

**Step 1: Check _fbp Cookie**
```javascript
debugMeta.getFbpCookie()  // Should return something like: fb.1.1234567890...
```

If empty:
- Cookies not being created
- Check if cookies are enabled in browser
- Check if Secure flag is required (HTTPS only)

**Step 2: Verify Events Are Being Sent**
```javascript
// Watch network tab in DevTools
// Open Network tab (F12)
// Reload page
// Look for POST requests to /api/meta/events
// Should show 200 status
```

**Step 3: Check Server Logs**
- Look for [Meta CAPI] logs
- Verify fbp field is present
- Check for any error messages

**Step 4: Verify Meta API Connection**
- Ensure META_ACCESS_TOKEN is set
- Token must have `ads_management` scope
- Try regenerating token if old

### Problem: Events Not Showing in Meta Events Manager

**Check 1: Pixel ID**
- Verify NEXT_PUBLIC_META_PIXEL_ID is correct
- Go to Business Settings → Pixels to confirm

**Check 2: API Token**
- Verify META_ACCESS_TOKEN is set in production
- Check token has correct scopes

**Check 3: Network Requests**
- Open DevTools Network tab
- Look for failed requests to graph.facebook.com
- Check error messages

**Check 4: Browser Errors**
- Open console (F12)
- Look for red errors
- Share error with Meta support if persistent

### Problem: Events Appear But Coverage Not Increasing

**Possible Causes:**
1. FBP not being created (see above)
2. FBP format incorrect
3. Too few events (need 50+ to see significant change)
4. Meta has cache/delay (24-48 hours for diagnostics)

**Solution:**
1. Generate more traffic
2. Test from different browsers
3. Wait 2-3 days for Meta to process
4. Check Events Manager daily

---

## 📈 Once You Reach 75%

### 1. Optimize Ad Targeting
- Use better audience targeting with improved matching
- Leverage lookalike audiences with better data
- Create retargeting audiences

### 2. Add Customer Data
```
Advanced: Collect and send email/phone for even better results
This is optional but recommended for 8-9/10 Event Match Quality
```

### 3. Monitor Cost Per Result
- Should see 15-25% reduction in cost per result
- If not, check:
  - Campaign optimization settings
  - Audience targeting
  - Ad creative quality
  - Landing page quality

### 4. Scale Your Ads
- Increase budget on best-performing campaigns
- Expand to new audiences
- Test new ad creatives

---

## 🔧 Additional Improvements (Optional)

### Connect CRM Data
For even better results, integrate customer data:

1. Export customer emails from your CRM
2. Use Meta's Offline Conversions
3. Send hashed customer info with events

This improves Event Match Quality to 8-9/10.

### Custom Audiences
1. Upload customer lists
2. Create lookalike audiences
3. Retarget interested users

### Enhanced Conversions
1. Track more events (wish list, search, purchase)
2. Send more user data (name, address, etc.)
3. Connect Shopify for complete data flow

---

## ✨ Implementation Files Modified

Files that have been updated to improve Meta integration:

1. **lib/meta.ts**
   - ✅ FBP generation and persistence
   - ✅ Better FBC handling
   - ✅ Improved user data collection
   - ✅ SHA256 hashing for sensitive data

2. **components/providers/MetaPixelProvider.tsx**
   - ✅ Pre-initialize FBP cookie before pixel loads
   - ✅ Improved script loading
   - ✅ Better error handling

3. **app/api/meta/events/route.ts**
   - ✅ Enhanced CAPI payload
   - ✅ Better error logging
   - ✅ Improved user data handling
   - ✅ IP and User Agent collection

4. **.env.template**
   - ✅ Added comprehensive Meta configuration examples
   - ✅ Documentation for getting tokens

5. **lib/meta-debug.ts** (NEW)
   - 🆕 Debug utility for browser console
   - 🆕 Test event sending
   - 🆕 Cookie verification
   - 🆕 Full diagnostic reports

6. **META_PIXEL_SETUP.md** (NEW)
   - 🆕 Comprehensive setup guide
   - 🆕 Troubleshooting section
   - 🆕 Performance optimization tips

---

## 📞 Support Resources

- **Meta Conversions API Docs**: https://developers.facebook.com/docs/marketing-api/conversions-api
- **Events Manager**: https://business.facebook.com/events_manager
- **Business Settings**: https://business.facebook.com/settings
- **Debug Tools**: Run `debugMeta.fullDiagnostic()` in browser console

---

## ✅ Completion Checklist

- [ ] Created `.env.local` with Meta tokens
- [ ] Tested locally with `debugMeta.fullDiagnostic()`
- [ ] Verified API connection with `debugMeta.sendTestEvent()`
- [ ] Updated environment variables on hosting
- [ ] Deployed new code to production
- [ ] Verified cookies are being created
- [ ] Confirmed events appear in Meta Events Manager
- [ ] Monitored for 2-3 days
- [ ] Reached 75%+ FBP coverage
- [ ] Verified cost per result improvement
- [ ] (Optional) Implemented customer data collection
- [ ] (Optional) Scaled ad spend

---

**Status**: ✅ Ready to Deploy
**Expected Result**: 75%+ event coverage → 24.2% lower cost per result
**Timeline**: 3-7 days to optimal performance

---

*Last Updated: 2026-07-06*
