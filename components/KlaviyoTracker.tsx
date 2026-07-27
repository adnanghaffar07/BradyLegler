'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { track, trackPage } from '@/tools/klaviyo/client';

const isDevelopment = process.env.NODE_ENV !== 'production';
const klaviyoPublicKey = process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY;
const KLAVIYO_SCRIPT_URL = klaviyoPublicKey
  ? `https://static.klaviyo.com/onsite/onsite.js?kid=${klaviyoPublicKey}`
  : null;

const MARKETING_PAGE_EVENTS: Record<string, string> = {
  '/lucia': 'Viewed Lucia Page',
  '/concierge': 'Viewed Concierge Page',
  '/about': 'Viewed About Page',
  '/collections': 'Viewed Collections Page'
};
const TRACKED_PATH_STORAGE_KEY = 'klaviyo-last-tracked-path';

declare global {
  interface Window {
    _learnq?: Array<unknown[]>;
    klaviyo?: {
      push: (...args: unknown[]) => void;
    };
  }
}

const KlaviyoTracker = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (isDevelopment) {
      console.log('[Klaviyo] Script loading started', { url: KLAVIYO_SCRIPT_URL, pathname, searchParams: searchParams?.toString() });
    }

    const currentPath = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
    const previousPath = window.sessionStorage.getItem(TRACKED_PATH_STORAGE_KEY);

    if (lastTrackedPathRef.current === currentPath || previousPath === currentPath) {
      return;
    }

    lastTrackedPathRef.current = currentPath;
    window.sessionStorage.setItem(TRACKED_PATH_STORAGE_KEY, currentPath);

    trackPage(currentPath);

    const marketingEvent = MARKETING_PAGE_EVENTS[currentPath.split('?')[0]];
    if (marketingEvent) {
      track(marketingEvent);
    }
  }, [pathname, searchParams]);

  if (!KLAVIYO_SCRIPT_URL) {
    return null;
  }

  return (
    <Script
      id="klaviyo-onsite"
      strategy="afterInteractive"
      src={KLAVIYO_SCRIPT_URL}
      onLoad={() => {
        if (typeof window !== 'undefined') {
          if (isDevelopment) {
            console.log('[Klaviyo] Script finished loading', {
              url: KLAVIYO_SCRIPT_URL,
              learnqExists: Boolean(window._learnq),
              klaviyoExists: Boolean(window.klaviyo)
            });
          }

          window._learnq = window._learnq || [];
          if (isDevelopment) {
            console.log('[Klaviyo] _learnq state after init', { learnqExists: Boolean(window._learnq), klaviyoExists: Boolean(window.klaviyo) });
          }
          window._learnq.push(['account', klaviyoPublicKey]);
          window._learnq.push(['track', 'Viewed Page']);
        }
      }}
      onError={() => {
        if (isDevelopment) {
          console.error('[Klaviyo] Script load failed', { url: KLAVIYO_SCRIPT_URL });
        }
      }}
    />
  );
};

export default KlaviyoTracker;
