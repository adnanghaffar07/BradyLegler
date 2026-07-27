type KlaviyoProperties = Record<string, string | number | boolean | undefined | null>;

const PENDING_IDENTIFY_STORAGE_KEY = 'klaviyo-pending-identify';

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
    return;
  }

  const properties: KlaviyoProperties = {
    $email: email,
    ...(firstName ? { $first_name: firstName } : {}),
    ...(lastName ? { $last_name: lastName } : {})
  };

  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(PENDING_IDENTIFY_STORAGE_KEY, '1');
  }

  learnq.push(['identify', properties]);

  if (typeof window !== 'undefined') {
    queueMicrotask(() => {
      window.sessionStorage.removeItem(PENDING_IDENTIFY_STORAGE_KEY);
    });
  }
};

export const trackPage = (path?: string) => {
  const learnq = ensureLearnq();

  if (!learnq) {
    return;
  }

  const sendPageView = () => {
    learnq.push(['track', 'Viewed Page']);
  };

  if (typeof window !== 'undefined' && window.sessionStorage.getItem(PENDING_IDENTIFY_STORAGE_KEY) === '1') {
    queueMicrotask(sendPageView);
    return;
  }

  sendPageView();
};

export const track = (eventName: string, properties?: KlaviyoProperties) => {
  const learnq = ensureLearnq();

  if (!learnq || !eventName) {
    return;
  }

  learnq.push(['track', eventName, sanitiseProperties(properties)]);
};
