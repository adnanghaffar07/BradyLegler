'use client';

/**
 * Meta Pixel Provider
 *
 * This provider:
 * 1. Loads the Meta Pixel script (which creates _fbp cookie)
 * 2. Initializes FBP cookie manually if needed
 * 3. Initializes the pixel with the correct ID
 * 4. Tracks PageView on route changes (Next.js App Router)
 * 5. Provides tracking context to child components
 */

import React, { useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/meta';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const isDev = process.env.NODE_ENV === 'development';

function initializeFbpCookie(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const name = '_fbp';
  const nameEQ = name + '=';
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return;
    }
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const random = Math.floor(Math.random() * 1000000000);
  const fbp = `fb.1.${timestamp}.${random}`;

  try {
    const secureFlag = window.location.protocol === 'https:' ? ' Secure; SameSite=None;' : '';
    document.cookie = `_fbp=${fbp}; path=/; max-age=${60 * 60 * 24 * 90};${secureFlag}`;
  } catch (error) {
    console.warn('[Meta] Failed to set _fbp cookie', error);
  }
}

export const MetaPixelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathnameRef = useRef<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!PIXEL_ID) {
      console.warn('[Meta] Pixel ID not configured');
      return;
    }

    initializeFbpCookie();

    if (pathnameRef.current === pathname) {
      return;
    }

    pathnameRef.current = pathname;

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
      if (isDev) console.log('[Meta] PageView tracked on route change:', pathname);
    }
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
            fbq('track', 'PageView');
          `,
        }}
        onLoad={() => {
          if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', 'PageView');
          }
        }}
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
