import { Metadata } from 'next';
import openGraphImage from '@/assets/images/open-graph.png';

const metadata: Metadata = {
  title: 'Brady Legler',
  description: 'This is a general description of the website.',
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
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png'
  },
  openGraph: {
    title: 'Brady Legler',
    description: 'This is a general description of the website.',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'Brady Legler',
    images: [
      {
        url: process.env.NEXT_PUBLIC_SITE_URL + openGraphImage.src,
        width: openGraphImage.width,
        height: openGraphImage.height
      }
    ],
    locale: 'en_UK',
    type: 'website'
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
};

export default metadata;
