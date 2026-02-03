/** @type {import('next').NextConfig} */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use dynamic imports for your redirects and rewrites
let redirects = [];
let rewrites = [];

// Load config files dynamically
try {
  const redirectsModule = await import('./config/redirects.js');
  redirects = redirectsModule.default || redirectsModule;
} catch (error) {
  // Silently handle missing redirects
}

try {
  const rewritesModule = await import('./config/rewrites.js');
  rewrites = rewritesModule.default || rewritesModule;
} catch (error) {
  // Silently handle missing rewrites
}

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    dirs: ['pages', 'components', 'sections', 'tools', 'assets'],
    ignoreDuringBuilds: false
  },
  trailingSlash: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io'
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com'
      }
    ]
  },
  experimental: {
    taint: true
  },
  poweredByHeader: false,
  reactStrictMode: true,
  sassOptions: {
    includePaths: [path.join(__dirname, 'tools/sass/base')],
    prependData: '@import "resources.scss";'
  },

  redirects: async () => {
    // Check if Sanity environment variables are available
    if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
      return redirects;
    }

    try {
      const fetchSanityRedirects = (await import('./tools/sanity/helpers/fetchSanityRedirects.js')).default;
      const sanityRedirects = await fetchSanityRedirects();
      return [...redirects, ...sanityRedirects];
    } catch (error) {
      return redirects; // Fallback to static redirects only
    }
  },

  async rewrites() {
    return rewrites;
  },

  webpack(config) {
    const fileLoaderRule = config.module.rules.find(rule => rule.test?.test?.('.svg'));
    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/ // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        resourceQuery: { not: /url/ }, // exclude if *.svg?url
        use: ['@svgr/webpack']
      }
    );
    fileLoaderRule.exclude = /\.svg$/i;
    return config;
  }
};

export default nextConfig;
