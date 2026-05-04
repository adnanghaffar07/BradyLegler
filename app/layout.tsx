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
  return (
    <html lang="en-US">
      <head>
        {/* Google Tag Manager */}
        <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-5WPFTSXZ');` }} />
        {/* End Google Tag Manager */}
        <link rel="icon" type="image/png" sizes="180x180" href="/apple-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="mask-icon" href="/favicon.svg" color="#0a0a0a" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="white" />
      </head>
      <body className={fonts}>
        {/* Google Tag Manager (noscript) */}
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5WPFTSXZ" height="0" width="0" style={{ display: 'none', visibility: 'hidden' }}></iframe></noscript>
        {/* End Google Tag Manager (noscript) */}
        <Providers>{children}</Providers>
      </body>
      <Scripts loadAll />
    </html>
  );
};

export const viewport: Viewport = {
  initialScale: 1,
  width: 'device-width',
  themeColor: '#FFF'
};

export default RootLayout;
