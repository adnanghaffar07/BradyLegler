// Repository > tools/analytics/pixel/customPixel.js

// --------------------------------------------------
// VARIABLES
const DEBUG = true;
const STORE_NAME = 'Brady Legler';
const STORE_GTM_ID = 'GTM-NL3M9FRS';

// --------------------------------------------------
// GOOGLE TAG MANAGER

window.dataLayer = window.dataLayer || [];
const gtag = () => {
  dataLayer.push(arguments);
};
((w, d, s, l, i) => {
  w[l] = w[l] || [];
  w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  var f = d.getElementsByTagName(s)[0],
    j = d.createElement(s),
    dl = l != 'dataLayer' ? '&l=' + l : '';
  j.async = true;
  j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
  f.parentNode.insertBefore(j, f);
})(window, document, 'script', 'dataLayer', STORE_GTM_ID);
gtag('js', new Date());
(() => {
  try {
    const url = new URL(window.location.href);
    const clientId = url.searchParams.get('client_id');
    if (clientId) {
      window.clientId = clientId;
      // gtag('config', STORE_GTM_ID, {
      //   client_id: clientId
      // });
    }
  } catch (error) {
    return null;
  }
})();

const sendEvent = data => {
  try {
    const enrichedData = {
      ...data,
      client_id: window.clientId
    };

    if (DEBUG) {
      console.log(`Analytics Pixel`, enrichedData);
      return;
    }

    window.dataLayer.push(enrichedData);
  } catch (error) {
    // Silently handle error
  }
};

const formatItems = lineItems => {
  return lineItems?.map(item => {
    return {
      item_id: item.variant.product.id,
      item_name: item.variant.product.title,
      item_variant: item.variant.id,
      item_variant_sku: item.variant.sku,
      item_variant_name: item.variant.title,
      currency: item.variant.price.currencyCode,
      item_brand: item.variant.product.vendor || STORE_NAME,
      price: item.variant.price.amount,
      quantity: item.quantity
    };
  });
};

const formatCoupon = discountApplications => {
  return discountApplications
    ?.filter(discount => discount?.type === 'DISCOUNT_CODE')
    ?.map(discount => discount.title)
    ?.join(',');
};

// --------------------------------------------------
// EVENTS

// Event 1 - Checkout start
// The checkout_started event logs an instance where a customer begins the checkout process.
analytics.subscribe('checkout_started', event => {
  sendEvent({
    event: 'begin_checkout',
    ecommerce: {
      currency: event.data?.checkout?.currencyCode,
      value: event.data?.checkout?.totalPrice?.amount,
      coupon: formatCoupon(event.data?.checkout?.discountApplications),
      items: formatItems(event.data?.checkout?.lineItems)
    }
  });
});

// Event 2 - Contact Information submitted (Custom Event)
// The checkout_contact_info_submitted event logs an instance where a customer submits a checkout form.
analytics.subscribe('checkout_contact_info_submitted', event => {
  sendEvent({
    event: 'add_contact_info',
    ecommerce: {
      currency: event.data?.checkout?.currencyCode,
      value: event.data?.checkout?.totalPrice?.amount,
      coupon: formatCoupon(event.data?.checkout?.discountApplications),
      items: formatItems(event.data?.checkout?.lineItems)
    }
  });
});

// Event 3 - Shipping Method Selection
// The checkout_shipping_info_submitted event logs an instance where the customer chooses a shipping rate.
analytics.subscribe('checkout_shipping_info_submitted', event => {
  const shippingTier = event.data?.checkout?.delivery?.selectedDeliveryOptions?.map(option => option.handle).join(',');
  sendEvent({
    event: 'add_shipping_info',
    ecommerce: {
      currency: event.data?.checkout?.currencyCode,
      value: event.data?.checkout?.totalPrice?.amount,
      coupon: formatCoupon(event.data?.checkout?.discountApplications),
      shipping_tier: shippingTier,
      items: formatItems(event.data?.checkout?.lineItems)
    }
  });
});

// Event 4 - Payment Method & Billing Address Selection
// The payment_info_submitted event logs an instance of a customer submitting their payment information. This event is available on the checkout page.
analytics.subscribe('payment_info_submitted', event => {
  const paymentType = event?.data?.checkout?.transactions
    ?.map(transaction => transaction?.paymentMethod?.type)
    .join(',');
  sendEvent({
    event: 'add_payment_info',
    ecommerce: {
      currency: event.data?.checkout?.currencyCode,
      value: event.data?.checkout?.totalPrice?.amount,
      coupon: formatCoupon(event.data?.checkout?.discountApplications),
      payment_type: paymentType,
      items: formatItems(event.data?.checkout?.lineItems)
    }
  });
});

// Event 5 - Checkout completed
// The checkout_completed event logs when a visitor completes a purchase. It's triggered once for each checkout, typically on the Thank you page.
analytics.subscribe('checkout_completed', event => {
  sendEvent({
    event: 'purchase',
    ecommerce: {
      currency: event.data?.checkout?.currencyCode,
      value: event.data?.checkout?.totalPrice?.amount,
      transaction_id: event.data?.checkout?.order?.id || event.data?.checkout?.token,
      coupon: formatCoupon(event.data?.checkout?.discountApplications),
      shipping: event.data?.checkout?.shippingLine?.price?.amount || 0,
      tax: event.data?.checkout?.totalTax?.amount || 0,
      items: formatItems(event.data?.checkout?.lineItems)
    }
  });
});
