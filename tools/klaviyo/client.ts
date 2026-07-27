type KlaviyoProperties = Record<string, string | number | boolean | undefined | null>;

const isDevelopment = process.env.NODE_ENV !== 'production';

const debugLog = (...args: unknown[]) => {
  if (isDevelopment && typeof window !== 'undefined') {
    console.log('[Klaviyo]', ...args);
  }
};

declare global {
  interface Window {
    _learnq?: Array<unknown[]>;
  }
}

const ensureLearnq = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!window._learnq) {
    window._learnq = [];
  }

  return window._learnq;
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
  const learnq = ensureLearnq();

  if (!learnq || !email) {
    debugLog('identify skipped', { email, firstName, lastName });
    return;
  }

  const properties: KlaviyoProperties = {
    $email: email,
    ...(firstName ? { $first_name: firstName } : {}),
    ...(lastName ? { $last_name: lastName } : {})
  };

  debugLog('identify queued', { email, firstName, lastName, properties });
  learnq.push(['identify', properties]);
};

export const trackPage = () => {
  const learnq = ensureLearnq();

  if (!learnq) {
    debugLog('page view skipped because _learnq is unavailable');
    return;
  }

  debugLog('page view queued', { event: 'Viewed Page' });
  learnq.push(['track', 'Viewed Page']);
};

export const track = (eventName: string, properties?: KlaviyoProperties) => {
  const learnq = ensureLearnq();

  if (!learnq || !eventName) {
    debugLog('custom event skipped', { eventName, properties });
    return;
  }

  const sanitisedProperties = sanitiseProperties(properties);
  debugLog('custom event queued', { eventName, properties: sanitisedProperties });
  learnq.push(['track', eventName, sanitisedProperties]);
};
