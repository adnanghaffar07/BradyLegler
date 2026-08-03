'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import getIdFromGid from '@/tools/helpers/getIdFromGid';
import { sendGTMEvent } from '@next/third-parties/google';

const IS_DEV = process.env.NODE_ENV === 'development';
const DEBUG_MODE = false;
const COOKIE_NAME = 'bl_client_id';
const COOKIE_EXPIRY_DAYS = 730;

type UseAnalyticsProps = {
  defaultBrand?: string;
};

const useAnalytics = (props: UseAnalyticsProps = {}) => {
  const { defaultBrand = 'Brady Legler' } = props;
  const [clientId, setClientId] = useState<string | undefined>(undefined);

  // Queue to store events when client ID is not yet loaded
  const eventQueue = useRef<Array<{ event: string; [key: string]: any }>>([]);

  // Initialize client ID
  useEffect(() => {
    if (typeof window !== 'undefined' && !clientId) {
      let id = '';

      // Check if client ID is stored in cookies
      const cookies = `; ${document.cookie}`;
      const cookie = cookies?.split(`; ${COOKIE_NAME}=`);
      if (cookie.length === 2) {
        id = cookie.pop()?.split(';').shift() || '';
      }

      // Generate a new client ID if none
      if (!id) {
        id = `${Math.floor(Math.random() * 1000000000)}-${Date.now()}`;
        const expires = new Date();
        expires.setTime(expires.getTime() + COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        document.cookie = `${COOKIE_NAME}=${id};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
      }

      setClientId(id);

      // Process any queued events now that we have a client ID
      if (eventQueue.current.length > 0) {
        if (DEBUG_MODE) {
          console.log('%cProcessing queued analytics events', 'color: #0066ff; font-weight: bold;', eventQueue.current);
        }

        // Process each queued event
        eventQueue.current.forEach(data => {
          if (DEBUG_MODE) {
            console.log('%cSending queued event - ' + data.event, 'color: #0066ff; font-weight: bold;', {
              ...data,
              client_id: id
            });
          } else {
            sendGTMEvent({
              ...data,
              client_id: id
            });
          }
        });

        // Clear the queue
        eventQueue.current = [];
      }
    }
  }, [clientId]);

  // ===== Helper Functions =====

  const sendEvent = useCallback(
    (data: { event: string; [key: string]: any }) => {
      // If client ID is not available yet, queue the event for later
      if (!clientId) {
        if (DEBUG_MODE) {
          console.log('%cQueueing Analytics event - ' + data.event, 'color: #0066ff; font-weight: bold;', data);
        }
        eventQueue.current.push(data);
        return;
      }

      // Add client ID to the event data
      const enrichedData = {
        ...data,
        client_id: clientId
      };

      if (DEBUG_MODE) {
        console.log('%cAnalytics event - ' + data?.event, 'color: #0066ff; font-weight: bold;', enrichedData);
        return;
      }

      sendGTMEvent(enrichedData);
    },
    [clientId]
  );

  // ===== Events =====

  /**
   * Track product impressions (when products appear in a list)
   */
  const trackViewItemList = useCallback(
    ({ items, listName, listId }: AnalyticsViewItemListParams) => {
      sendEvent({
        event: 'view_item_list',
        ecommerce: {
          item_list_name: listName,
          item_list_id: getIdFromGid(listId),
          items: (items || []).map((item, index) => ({
            item_id: getIdFromGid(item.id),
            item_name: item.name,
            item_brand: item.brand || defaultBrand,
            item_category: item.category,
            item_variant: getIdFromGid(item.variant),
            price: Number(item.price),
            index: item.position || index + 1
          }))
        }
      });
    },
    [sendEvent, defaultBrand]
  );

  /**
   * Track when a user clicks on a product in a list
   */
  const trackSelectItem = useCallback(
    ({ item, listName, listId, currency }: AnalyticsSelectItemParams) => {
      sendEvent({
        event: 'select_item',
        ecommerce: {
          item_list_name: listName,
          item_list_id: getIdFromGid(listId),
          currency: currency,
          items: [
            {
              item_id: getIdFromGid(item.id),
              item_name: item.name,
              item_brand: item.brand || defaultBrand,
              item_category: item.category,
              item_variant: getIdFromGid(item.variant),
              price: Number(item.price),
              index: item.position || 1
            }
          ]
        }
      });
    },
    [sendEvent, defaultBrand]
  );

  /**
   * Track when a user views a product details page
   */
  const trackViewItem = useCallback(
    ({ item, currency }: AnalyticsViewItemParams) => {
      sendEvent({
        event: 'view_item',
        ecommerce: {
          currency,
          value: Number(item.price),
          items: [
            {
              item_id: getIdFromGid(item.id),
              item_name: item.name,
              item_brand: item.brand || defaultBrand,
              item_category: item.category,
              item_variant: getIdFromGid(item.variant),
              price: Number(item.price),
              quantity: item.quantity || 1
            }
          ]
        }
      });
    },
    [sendEvent, defaultBrand]
  );

  // ===== Shopping Cart Actions =====

  /**
   * Track when a user adds an item to their cart
   */
  const trackAddToCart = useCallback(
    ({ item, currency }: AnalyticsAddToCartParams) => {
      sendEvent({
        event: 'add_to_cart',
        ecommerce: {
          currency,
          value: item.price ? Number(item.price) * item.quantity : 0,
          items: [
            {
              item_id: getIdFromGid(item.id),
              item_name: item.name,
              item_brand: item.brand || defaultBrand,
              item_category: item.category,
              item_variant: getIdFromGid(item.variant),
              price: Number(item.price),
              quantity: item.quantity,
              coupon: item.coupon
            }
          ]
        }
      });
    },
    [sendEvent]
  );

  /**
   * Track when a user removes an item from their cart
   */
  const trackRemoveFromCart = useCallback(
    ({ item, currency }: AnalyticsRemoveFromCartParams) => {
      sendEvent({
        event: 'remove_from_cart',
        ecommerce: {
          currency,
          value: item.price ? Number(item.price) * item.quantity : 0,
          items: [
            {
              item_id: getIdFromGid(item.id),
              item_name: item.name,
              item_brand: item.brand || defaultBrand,
              item_category: item.category,
              item_variant: getIdFromGid(item.variant),
              price: Number(item.price),
              quantity: item.quantity
            }
          ]
        }
      });
    },
    [sendEvent, defaultBrand]
  );

  /**
   * Track when a user views their cart
   */
  const trackViewCart = useCallback(
    ({ items, currency, value }: AnalyticsViewCartParams) => {
      if (!items?.length) return;
      // Calculate value if not provided
      const cartValue =
        Number(value) || items.reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0);

      sendEvent({
        event: 'view_cart',
        ecommerce: {
          currency,
          value: cartValue,
          items: items.map(item => ({
            item_id: getIdFromGid(item.id),
            item_name: item.name,
            item_brand: item.brand || defaultBrand,
            item_category: item.category,
            item_variant: getIdFromGid(item.variant),
            price: Number(item.price),
            quantity: item.quantity,
            coupon: item.coupon
          }))
        }
      });
    },
    [sendEvent, defaultBrand]
  );

  // ===== Checkout Process =====

  /**
   * Track when a user starts the checkout process
   */
  const trackBeginCheckout = useCallback(
    ({ items, currency, value, coupon }: AnalyticsBeginCheckoutParams) => {
      sendEvent({
        event: 'begin_checkout',
        ecommerce: {
          currency,
          value: Number(value),
          coupon,
          items: items.map(item => ({
            item_id: getIdFromGid(item.id),
            item_name: item.name,
            item_brand: item.brand || defaultBrand,
            item_category: item.category,
            item_variant: getIdFromGid(item.variant),
            price: Number(item.price),
            quantity: item.quantity,
            coupon: item.coupon
          }))
        }
      });
    },
    [sendEvent, defaultBrand]
  );

  /**
   * Track when a user generates a lead (e.g., signs up for newsletter).
   * `generate_lead` is a standard GA4 event, not an ecommerce one, so its
   * parameters are sent at the top level of the dataLayer push rather than
   * nested under `ecommerce` (see https://support.google.com/analytics/answer/9267735).
   */
  const trackGenerateLead = useCallback(
    ({ value, currency, formName }: AnalyticsGenerateLeadParams) => {
      sendEvent({
        event: 'generate_lead',
        ...(currency ? { currency } : {}),
        ...(value !== undefined ? { value } : {}),
        ...(formName ? { form_name: formName } : {}),
        page_location: typeof window !== 'undefined' ? window.location.href : undefined
      });
    },
    [sendEvent]
  );

  /**
   * Track when a user signs up
   */
  const trackSignUp = useCallback(
    ({ method }: AnalyticsSignUpParams) => {
      sendEvent({
        event: 'sign_up',
        ecommerce: {
          method
        }
      });
    },
    [sendEvent]
  );

  /**
   * Track when a user logs in
   */
  const trackLogin = useCallback(
    ({ method }: AnalyticsLoginParams) => {
      sendEvent({
        event: 'login',
        ecommerce: {
          method
        }
      });
    },
    [sendEvent]
  );

  /**
   * Track when a user performs a search
   */
  const trackSearch = useCallback(
    ({ searchTerm }: AnalyticsSearchParams) => {
      sendEvent({
        event: 'search',
        ecommerce: {
          search_term: searchTerm
        }
      });
    },
    [sendEvent]
  );

  // Track any custom event
  const trackEvent = useCallback(
    ({ eventName, eventParams = {} }: AnalyticsTrackEvent) => {
      sendEvent({ event: eventName, ecommerce: eventParams });
    },
    [sendEvent]
  );

  return {
    // Product discovery
    trackViewItemList,
    trackSelectItem,
    trackViewItem,

    // Cart actions
    trackAddToCart,
    trackRemoveFromCart,
    trackViewCart,

    // Checkout
    trackBeginCheckout,

    // User engagement
    trackGenerateLead,
    trackSignUp,
    trackLogin,
    trackSearch,

    // Generic
    trackEvent,

    // Client ID
    clientId
  };
};

export default useAnalytics;
