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
