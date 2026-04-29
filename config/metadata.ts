import { Metadata } from 'next';

const SITE_DESCRIPTION =
  'Discover Brady Legler jewelry and collections crafted with emotion, intention, and timeless design. Contact us for inquiries, support, or press information.';

const metadata: Metadata = {
  title: 'Brady Legler',
  description: SITE_DESCRIPTION,
  generator: 'Brady Legler',
  applicationName: 'Brady Legler',
  referrer: 'origin-when-cross-origin',
  keywords: ['Brady Legler'],
  authors: [{ name: 'Brady Legler' }],
  creator: 'Brady Legler',
  publisher: 'Brady Legler',
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || ''),
  icons: {
    icon: ['/apple-icon.png', '/favicon.svg'],
    shortcut: ['/apple-icon.png'],
    apple: ['/apple-icon.png', '/apple-touch-icon.png']
  },
  openGraph: {
    title: 'Brady Legler',
    description: SITE_DESCRIPTION,
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'Brady Legler',
    images: [{ url: '/opengraph-image/' }],
    locale: 'en_US',
    type: 'website',
    appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || undefined
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brady Legler',
    description: SITE_DESCRIPTION,
    images: ['/twitter-image/']
  },
  robots: {
    index: true,
    follow: false,
    nocache: true,
    googleBot: {
      index: true,
      follow: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
};

export default metadata;
