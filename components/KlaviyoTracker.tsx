'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { track, trackPage } from '@/tools/klaviyo/client';

const isDevelopment = process.env.NODE_ENV !== 'production';
const klaviyoPublicKey = process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY;

// Official Klaviyo.js onsite tracking snippet URL, per developers.klaviyo.com/en/docs/javascript_api
// and help.klaviyo.com "Getting started with Klaviyo onsite tracking":
//   https://static.klaviyo.com/onsite/js/PUBLIC_API_KEY/klaviyo.js
// (NOT /onsite/onsite.js?kid=... — that path/param does not exist on Klaviyo's CDN and 403s.)
const KLAVIYO_SCRIPT_URL = klaviyoPublicKey
  ? `https://static.klaviyo.com/onsite/js/${klaviyoPublicKey}/klaviyo.js`
  : null;

const MARKETING_PAGE_EVENTS: Record<string, string> = {
  '/lucia': 'Viewed Lucia Page',
  '/concierge': 'Viewed Concierge Page',
  '/about': 'Viewed About Page',
  '/collections': 'Viewed Collections Page'
};
const TRACKED_PATH_STORAGE_KEY = 'klaviyo-last-tracked-path';

const KlaviyoTracker = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (isDevelopment) {
      console.log('[Klaviyo] Tracking pathname change', {
        url: KLAVIYO_SCRIPT_URL,
        pathname,
        searchParams: searchParams?.toString(),
        klaviyoExists: Boolean(window.klaviyo)
      });
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
      track(marketingEvent, { url: window.location.href, path: currentPath });
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
        if (isDevelopment && typeof window !== 'undefined') {
          console.log('[Klaviyo] onsite.js finished loading', {
            url: KLAVIYO_SCRIPT_URL,
            klaviyoExists: Boolean(window.klaviyo)
          });
        }
      }}
      onError={() => {
        if (isDevelopment) {
          console.error('[Klaviyo] onsite.js failed to load', { url: KLAVIYO_SCRIPT_URL });
        }
      }}
    />
  );
};

export default KlaviyoTracker;
