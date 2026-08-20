type KlaviyoProperties = Record<string, string | number | boolean | undefined | null>;
type KlaviyoOnsiteQueueEntry = unknown[];

const isDevelopment = process.env.NODE_ENV !== 'production';

const debugLog = (...args: unknown[]) => {
  if (isDevelopment && typeof window !== 'undefined') {
    console.log('[Klaviyo]', ...args);
  }
};

declare global {
  interface Window {
    _klOnsite?: KlaviyoOnsiteQueueEntry[];
    klaviyo?: {
      push: (...args: unknown[]) => void;
      identify: (properties: KlaviyoProperties, callback?: (result: unknown) => void) => Promise<unknown> | void;
      track: (
        event: string,
        properties?: KlaviyoProperties,
        callback?: (result: unknown) => void
      ) => Promise<unknown> | void;
      trackViewedItem: (item: KlaviyoViewedItem, callback?: (result: unknown) => void) => Promise<unknown> | void;
    };
  }
}

// Shape expected by Klaviyo's dedicated trackViewedItem API, which (separately from a plain
// track() call) populates the profile's "recently viewed" product feed used by Browse
// Abandonment emails and product-recommendation blocks. See
// developers.klaviyo.com "Integrate a platform without a pre-built Klaviyo integration".
export type KlaviyoViewedItem = {
  Title: string;
  ItemId: string;
  Categories?: string[];
  ImageUrl?: string;
  Url?: string;
  Metadata?: {
    Brand?: string;
    Price?: number;
    CompareAtPrice?: number;
  };
};

// Official Klaviyo async-loading proxy stub, reproduced verbatim in behaviour from
// developers.klaviyo.com/en/docs/introduction_to_the_klaviyo_object.
// Queues identify()/track() calls into window._klOnsite until the real klaviyo.js
// (loaded by KlaviyoTracker) finishes loading and replaces this Proxy, so calls made
// before the async script resolves are never lost.
const installKlaviyoProxyStub = () => {
  if (typeof window === 'undefined' || window.klaviyo) {
    return;
  }

  window._klOnsite = window._klOnsite || [];
  const onsiteQueue = window._klOnsite;

  try {
    window.klaviyo = new Proxy(
      {},
      {
        get(_target, property: string) {
          if (property === 'push') {
            return (...args: unknown[]) => {
              onsiteQueue.push(args);
            };
          }

          return (...args: unknown[]) => {
            const callback = typeof args[args.length - 1] === 'function' ? (args.pop() as (result: unknown) => void) : undefined;

            return new Promise<unknown>(resolve => {
              onsiteQueue.push([
                property,
                ...args,
                (result: unknown) => {
                  callback?.(result);
                  resolve(result);
                }
              ]);
            });
          };
        }
      }
    ) as Window['klaviyo'];
  } catch {
    // Environments without Proxy support (very old browsers): fall back to a plain queue array.
    const fallback = { push: (...args: unknown[]) => onsiteQueue.push(args) };
    window.klaviyo = fallback as unknown as Window['klaviyo'];
  }
};

installKlaviyoProxyStub();

const sanitiseProperties = (properties?: KlaviyoProperties) => {
  if (!properties) {
    return {} as KlaviyoProperties;
  }

  return Object.entries(properties).reduce<KlaviyoProperties>((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = value;
    }
    return acc;
  }, {});
};

export const identify = (email: string, firstName?: string, lastName?: string) => {
  installKlaviyoProxyStub();

  if (typeof window === 'undefined' || !window.klaviyo || !email) {
    debugLog('identify skipped', { email, firstName, lastName });
    return;
  }

  const properties: KlaviyoProperties = {
    email,
    ...(firstName ? { first_name: firstName } : {}),
    ...(lastName ? { last_name: lastName } : {})
  };

  debugLog('identify queued', { email, firstName, lastName, properties });
  window.klaviyo.identify(properties);
};

export const trackPage = (path: string) => {
  installKlaviyoProxyStub();

  if (typeof window === 'undefined' || !window.klaviyo) {
    debugLog('page view skipped because klaviyo object is unavailable');
    return;
  }

  const properties: KlaviyoProperties = {
    url: window.location.href,
    path
  };

  debugLog('page view queued', { event: 'Viewed Page', properties });
  window.klaviyo.track('Viewed Page', properties);
};

export const track = (eventName: string, properties?: KlaviyoProperties) => {
  installKlaviyoProxyStub();

  if (typeof window === 'undefined' || !window.klaviyo || !eventName) {
    debugLog('custom event skipped', { eventName, properties });
    return;
  }

  const sanitisedProperties = sanitiseProperties(properties);
  debugLog('custom event queued', { eventName, properties: sanitisedProperties });
  window.klaviyo.track(eventName, sanitisedProperties);
};

export const trackViewedItem = (item: KlaviyoViewedItem) => {
  installKlaviyoProxyStub();

  if (typeof window === 'undefined' || !window.klaviyo || !item?.Title || !item?.ItemId) {
    debugLog('viewed item skipped', { item });
    return;
  }

  debugLog('viewed item queued', { item });
  window.klaviyo.trackViewedItem(item);
};
