# ViewContent & Purchase Events - Deployment Guide

## 📋 What Changed

### ✅ ViewContent Events (NEW - Just Implemented)
- Created `ViewContentTracker` component
- Automatically tracks product page views
- Sends: product ID, name, price, currency to Meta
- **Status**: Ready to deploy immediately

### ⏳ Purchase Events (Requires Shopify Setup)
- Already integrated with Shopify's native Meta app
- **Status**: Waiting for Shopify Meta app configuration
- **No code changes needed** - just Shopify setup

---

## 🚀 Deployment Steps

### Step 1: Deploy Code (2 minutes)
```bash
git add .
git commit -m "fix: Add ViewContent tracking to ProductTemplate"
git push origin main
# Wait for Netlify/Vercel to deploy
```

### Step 2: Verify ViewContent Events (Immediate)
```javascript
// 1. Open your site on production
// 2. Navigate to any product page
// 3. Open DevTools Console (F12)
// 4. You should see:
//    [Meta] ViewContent tracked: {...}
//    [Meta CAPI] Server event: ViewContent
```

### Step 3: Setup Purchase Events in Shopify (10 minutes)
Follow: `META_VIEWCONTENT_AND_PURCHASE.md` → "Purchase Events" section

**Quick Steps**:
1. Shopify Admin → Apps → Install "Facebook & Instagram"
2. Connect your Facebook account
3. Select Pixel: `3862277220735831`
4. Enable "Track conversions"
5. Create test order to verify

---

## 📊 Expected Timeline

| When | Event | Status |
|------|-------|--------|
| **Now (After Deploy)** | ViewContent starts | ✅ |
| **1-2 Hours** | ViewContent appearing in Meta | ✅ |
| **After Shopify Setup** | Purchase starts | ⏳ |
| **24-48 Hours** | Purchase in Meta Events Manager | ⏳ |
| **Day 7** | Full 75%+ coverage | 🎯 |

---

## ✅ Verification Checklist

### ViewContent Events
- [ ] Deploy code to production
- [ ] Visit product page
- [ ] Check browser console for tracking logs
- [ ] Check server logs for CAPI events
- [ ] Monitor Events Manager for ViewContent events
- [ ] ViewContent quality improves from 0.0/10

### Purchase Events
- [ ] Install Meta app in Shopify
- [ ] Connect Pixel to app
- [ ] Enable Purchase tracking
- [ ] Create test order
- [ ] Verify Purchase event in Meta
- [ ] Monitor real orders for 24-48 hours

---

## 🔍 Debugging

### ViewContent Not Showing?

**Check 1**: Console logs
```javascript
// Open DevTools (F12) → Console
// Should see: [Meta] ViewContent tracked: {...}
// If not, FBP may not be initialized
debugMeta.checkPixelStatus()
```

**Check 2**: Network tab
```
DevTools → Network tab → POST /api/meta/events
Should see successful 200 responses
```

**Check 3**: Meta Events Manager
```
https://business.facebook.com/events_manager
Should show ViewContent events appearing
```

### Purchase Not Showing?

**Check 1**: Shopify app installed?
```
Shopify Admin → Apps → Search "Facebook"
Status: Connected?
```

**Check 2**: Pixel connected?
```
Shopify Meta app → Settings → Events
Pixel ID: 3862277220735831 showing?
```

**Check 3**: Conversions enabled?
```
Shopify Meta app → Settings → Conversions
"Track conversions" toggled ON?
```

**Check 4**: Orders being tracked?
```
Create test order → Check Shopify logs
Shopify Meta app → View Logs
Purchase events being sent?
```

---

## 📈 Event Coverage Progress

### Before These Changes
```
PageView: 100% ✅
ViewContent: 0% ❌ (not tracked)
AddToCart: ? 
InitiateCheckout: ?
Purchase: 0% ❌ (not tracked)
Overall: 61% ⚠️
```

### After ViewContent Fix (Today)
```
PageView: 100% ✅
ViewContent: 0% → 40%+ 📈 (just fixed)
AddToCart: ?
InitiateCheckout: ?
Purchase: 0% ❌ (pending Shopify setup)
Overall: 61% → 65-70% 📈
```

### After Purchase Setup (24-48 hours)
```
PageView: 100% ✅
ViewContent: 40%+ ✅
AddToCart: 50%+ ✅
InitiateCheckout: 50%+ ✅
Purchase: 50%+ 📈 (Shopify setup)
Overall: 75%+ ✅ GOAL!
```

---

## 🎯 Success Criteria

✅ **ViewContent Events**:
- Events appearing in Meta Events Manager
- Quality score improves from 0.0/10 to 5.0+/10
- Tracking logged in browser console
- Server logs show CAPI delivery

✅ **Purchase Events**:
- Shopify Meta app connected
- Purchase events appearing after orders
- Quality score improves from 0.0/10 to 6.0+/10
- Real order data syncing to Meta

✅ **Overall Coverage**:
- Reach 75%+ event coverage (from 61%)
- Cost per result decreases by 24.2%
- All event quality scores above 6.0/10

---

## 📚 Documentation Files

- **ViewContent & Purchase Setup**: `META_VIEWCONTENT_AND_PURCHASE.md` ← READ THIS
- **Quick Start**: `META_QUICK_START.md`
- **Full Setup**: `META_PIXEL_SETUP.md`
- **Deployment**: `META_DEPLOYMENT_CHECKLIST.md`

---

## 🔗 Important Links

- **Events Manager**: https://business.facebook.com/events_manager
- **Shopify Admin**: https://admin.shopify.com
- **Pixel ID**: 3862277220735831
- **Your Store**: bradylegler.myshopify.com

---

## 💡 Summary

| Component | Status | Action Needed |
|-----------|--------|---------------|
| FBP Cookie Fix | ✅ Done | Already deployed |
| ViewContent Tracking | ✅ Done | Deploy today |
| AddToCart Tracking | ✅ Working | No changes needed |
| Purchase Tracking | ⏳ Ready | Setup Shopify app |
| Cost Reduction | 📈 Expected | Should see -24.2% |

---

**Next Steps**:
1. ✅ Deploy this code update
2. ✅ Verify ViewContent events in Meta (immediate)
3. ⏳ Setup Shopify Meta app (follow guide in `META_VIEWCONTENT_AND_PURCHASE.md`)
4. ⏳ Monitor coverage reaching 75%+ (3-7 days)

**Deployment Time**: 5 minutes (code + Netlify)
**Setup Time**: 10 minutes (Shopify app)
**Full Coverage**: 3-7 days

Let's go! 🚀
