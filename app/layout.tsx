import React from 'react';
import type { Viewport } from 'next';
import fonts from '@/config/fonts';
import Scripts from '@/components/Scripts';
import { Providers } from './providers';
import '@/sass/global/styles.scss';

type RootLayoutProps = {
  children: React.ReactNode;
};

const RootLayout: React.FC<RootLayoutProps> = async props => {
  const { children } = props;
  const rawGtmId = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID;
  const gtmId = rawGtmId === '' ? null : rawGtmId ?? 'GTM-5WPFTSXZ';

  return (
    <html lang="en-US">
      <head>
        <link rel="preconnect" href="https://cdn.sanity.io" crossOrigin="" />
        <link rel="dns-prefetch" href="https://cdn.sanity.io" />
        <link rel="icon" type="image/png" sizes="180x180" href="/apple-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="mask-icon" href="/favicon.svg" color="#0a0a0a" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="white" />
      </head>
      <body className={fonts}>
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            ></iframe>
          </noscript>
        )}
        <Providers>{children}</Providers>
        <Scripts loadAll />
      </body>
    </html>
  );
};

export const viewport: Viewport = {
  initialScale: 1,
  width: 'device-width',
  themeColor: '#FFF'
};

export default RootLayout;
