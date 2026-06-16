'use client';

/**
 * Meta Pixel Provider
 *
 * This provider:
 * 1. Loads the Meta Pixel script
 * 2. Initializes the pixel with the correct ID
 * 3. Tracks PageView on route changes (Next.js App Router)
 * 4. Provides tracking context to child components
 */

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/meta';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const isDev = process.env.NODE_ENV === 'development';

function trackPageViewWhenReady(pathname: string, pathnameRef: React.MutableRefObject<string | null>) {
  if (pathnameRef.current !== null) return;
  pathnameRef.current = pathname;

  const sendPageView = () => {
    trackPageView();
    if (isDev) console.log('[Meta] Initial PageView tracked when fbq was ready');
  };

  if (typeof window !== 'undefined' && window.fbq) {
    sendPageView();
    return;
  }

  let attempts = 0;
  const interval = window.setInterval(() => {
    attempts += 1;
    if (window.fbq || attempts >= 15) {
      window.clearInterval(interval);
      sendPageView();
    }
  }, 200);
}

export const MetaPixelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathnameRef = useRef<string | null>(null);
  const pathname = usePathname();

  // Load Meta Pixel script on mount
  useEffect(() => {
    if (!PIXEL_ID) {
      console.warn('[Meta] Pixel ID not configured');
      return;
    }
    // Only load if not already loaded - use a script marker to detect initialization
    const existing = document.querySelector('script[data-meta-pixel="' + PIXEL_ID + '"]');
    if (existing) {
      if (isDev) console.log('[Meta] Pixel already loaded (script present)');

      if (pathnameRef.current === null) {
        trackPageViewWhenReady(pathname, pathnameRef);
      }

      return;
    }

    // Load Meta Pixel script (snippet defines fbq immediately so calls can be queued)
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${PIXEL_ID}');
    `;
    script.async = true;
    script.setAttribute('data-meta-pixel', `${PIXEL_ID}`);
    script.onload = () => {
      trackPageViewWhenReady(pathname, pathnameRef);
    };
    script.onerror = () => {
      console.error('[Meta] Failed to load Facebook Pixel script');
      if (pathnameRef.current === null) {
        pathnameRef.current = pathname;
        trackPageView();
      }
    }

    // Track PageView on pathname change
    if (pathname !== pathnameRef.current) {
      pathnameRef.current = pathname;
      trackPageView();
      if (isDev) console.log('[Meta] PageView tracked on route change:', pathname);
    }
  }, [pathname]);

  return <>{children}</>;
};
