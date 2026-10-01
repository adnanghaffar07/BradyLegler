type KlaviyoProperties = Record<string, string | number | boolean | undefined | null>;

const isDevelopment = process.env.NODE_ENV !== 'production';

const debugLog = (...args: unknown[]) => {
  if (isDevelopment && typeof window !== 'undefined') {
    console.log('[Klaviyo]', ...args);
  }
};

declare global {
  interface Window {
    _klOnsite?: unknown[];
    klaviyo?: {
      push: (...args: unknown[]) => void;
      identify: (properties: KlaviyoProperties, callback?: (result: unknown) => void) => Promise<unknown> | void;
      track: (
        event: string,
        properties?: KlaviyoProperties,
        callback?: (result: unknown) => void
      ) => Promise<unknown> | void;
      trackViewedItem: (item: KlaviyoViewedItem, callback?: (result: unknown) => void) => Promise<unknown> | void;
      // Present only on the fully-loaded library, never on a placeholder.
      isIdentified?: () => boolean;
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

/**
 * Deferred dispatch for Klaviyo onsite calls.
 *
 * klaviyo.js is loaded with next/script `afterInteractive`, so page-view and
 * product-view effects routinely run BEFORE it exists. Anything called in that
 * window has to be held and replayed once the library is ready.
 *
 * This used to be handled by a hand-rolled Proxy that pushed calls into
 * `window._klOnsite`. That array was never drained - klaviyo.js installs the real
 * object and leaves it untouched - so every event fired before the script finished
 * loading was silently dropped. In practice that was most of them, which is why
 * onsite metrics (Active on Site, Viewed Product) stayed empty and Browse
 * Abandonment never triggered. We now keep our own queue and flush it ourselves.
 */
const pendingCalls: Array<() => void> = [];
let pollTimer: ReturnType<typeof setInterval> | null = null;
let waitedMs = 0;

const POLL_INTERVAL_MS = 200;
const MAX_WAIT_MS = 30_000;

/**
 * True only once the real library is present. `isIdentified` ships with klaviyo.js
 * and is absent from any placeholder, which makes it a reliable marker.
 */
const isKlaviyoReady = (): boolean =>
  typeof window !== 'undefined' && typeof window.klaviyo?.isIdentified === 'function';

const flushPending = () => {
  while (pendingCalls.length > 0) {
    const call = pendingCalls.shift();
    try {
      call?.();
    } catch (error) {
      debugLog('queued call failed', error);
    }
  }
};

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

const startPolling = () => {
  if (pollTimer || typeof window === 'undefined') return;

  pollTimer = setInterval(() => {
    waitedMs += POLL_INTERVAL_MS;

    if (isKlaviyoReady()) {
      stopPolling();
      debugLog(`klaviyo.js ready after ${waitedMs}ms - flushing ${pendingCalls.length} queued call(s)`);
      flushPending();
      return;
    }

    if (waitedMs >= MAX_WAIT_MS) {
      stopPolling();
      debugLog(`klaviyo.js never became available after ${MAX_WAIT_MS}ms - dropping ${pendingCalls.length} call(s)`);
      pendingCalls.length = 0;
    }
  }, POLL_INTERVAL_MS);
};

/** Run now if the library is ready, otherwise hold it and replay on load. */
const dispatch = (description: string, call: () => void) => {
  if (typeof window === 'undefined') return;

  if (isKlaviyoReady()) {
    debugLog(`${description} sent`);
    call();
    return;
  }

  debugLog(`${description} deferred until klaviyo.js loads`);
  pendingCalls.push(call);
  startPolling();
};

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
  if (!email) {
    debugLog('identify skipped - no email');
    return;
  }

  const properties: KlaviyoProperties = {
    email,
    ...(firstName ? { first_name: firstName } : {}),
    ...(lastName ? { last_name: lastName } : {})
  };

  dispatch(`identify (${email})`, () => window.klaviyo?.identify(properties));
};

export const trackPage = (path: string) => {
  if (typeof window === 'undefined') return;

  const properties: KlaviyoProperties = {
    url: window.location.href,
    path
  };

  dispatch('page view', () => window.klaviyo?.track('Viewed Page', properties));
};

export const track = (eventName: string, properties?: KlaviyoProperties) => {
  if (!eventName) {
    debugLog('custom event skipped - no event name');
    return;
  }

  const sanitisedProperties = sanitiseProperties(properties);
  dispatch(`custom event (${eventName})`, () => window.klaviyo?.track(eventName, sanitisedProperties));
};

export const trackViewedItem = (item: KlaviyoViewedItem) => {
  if (!item?.Title || !item?.ItemId) {
    debugLog('viewed item skipped - missing Title/ItemId', item);
    return;
  }

  dispatch(`viewed item (${item.Title})`, () => window.klaviyo?.trackViewedItem(item));
};
