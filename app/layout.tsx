import React from 'react';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import fonts from '@/config/fonts';
import Scripts from '@/components/Scripts';
import { Providers } from './providers';
import '@/sass/global/styles.scss';

type RootLayoutProps = {
  children: React.ReactNode;
};

// Staging must never be indexed by search engines.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

const RootLayout: React.FC<RootLayoutProps> = async props => {
  const { children } = props;
  const rawGtmId = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID;
  const gtmId = rawGtmId === '' ? null : rawGtmId ?? 'GTM-5WPFTSXZ';

  return (
    <html lang="en-US">
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="preconnect" href="https://cdn.sanity.io" crossOrigin="" />
        <link rel="dns-prefetch" href="https://cdn.sanity.io" />
        <link rel="icon" type="image/png" sizes="180x180" href="/apple-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="mask-icon" href="/favicon.svg" color="#0a0a0a" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="white" />
        {gtmId && (
          <Script
            id="google-tag-manager"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`
            }}
          />
        )}
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
