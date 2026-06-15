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

      // Track initial page view if not tracked yet
      if (pathnameRef.current === null) {
        pathnameRef.current = pathname;
        trackPageView();
        if (isDev) console.log('[Meta] Initial PageView tracked (script present)');
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
    document.head.appendChild(script);

    // Immediately record initial page view and mark pathname to avoid duplicates
    if (pathnameRef.current === null) {
      pathnameRef.current = pathname;
      trackPageView();
      if (isDev) console.log('[Meta] Initial PageView tracked (after script injection)');
    }
  }, []);

  // Track PageView on route changes
  useEffect(() => {
    if (!PIXEL_ID) return;

    // Initialize pathname on first mount
    if (pathnameRef.current === null) {
      pathnameRef.current = pathname;
      // Track initial page view
      trackPageView();
      if (isDev) console.log('[Meta] Initial PageView tracked');
      return;
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
