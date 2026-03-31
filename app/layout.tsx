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
    <html lang="en-AU">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="white" />
      </head>
      <body className={fonts}>
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
