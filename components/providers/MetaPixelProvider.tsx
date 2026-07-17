'use client';

/**
 * Meta Pixel Provider
 *
 * This provider:
 * 1. Loads the Meta Pixel script
 * 2. Initializes the pixel with the correct ID
 * 3. Tracks PageView (browser + CAPI, deduplicated via event_id) once on
 *    initial load and again on every client-side route change
 *
 * `_fbp`/`_fbc` cookies are set server-side by middleware.ts before this
 * component even mounts; trackPageView() reads (or, as a fallback, creates)
 * them itself.
 */

import React, { useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/meta';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const isDev = process.env.NODE_ENV === 'development';

export const MetaPixelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathnameRef = useRef<string | null>(null);
  const firedInitialPageView = useRef(false);
  const pathname = usePathname();

  const fireInitialPageViewOnce = () => {
    if (firedInitialPageView.current) return;
    firedInitialPageView.current = true;
    trackPageView();
    if (isDev) console.log('[Meta] Initial PageView tracked:', pathname);
  };

  useEffect(() => {
    if (!PIXEL_ID) {
      console.warn('[Meta] Pixel ID not configured');
      return;
    }

    if (pathnameRef.current === null) {
      // First mount: the Script tag may still be loading, so only fire here
      // if fbq is already available (e.g. cached/fast script load). Script's
      // onLoad handles the more common case where it isn't ready yet.
      pathnameRef.current = pathname;
      if (typeof window !== 'undefined' && window.fbq) {
        fireInitialPageViewOnce();
      }
      return;
    }

    if (pathnameRef.current === pathname) return;
    pathnameRef.current = pathname;

    trackPageView();
    if (isDev) console.log('[Meta] PageView tracked on route change:', pathname);
  }, [pathname]);

  if (!PIXEL_ID) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
          `
        }}
        onLoad={fireInitialPageViewOnce}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
};
