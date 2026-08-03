/**
 * Video Responsive Utilities
 *
 * Helpers for managing responsive video content across desktop and mobile screens.
 * Supports CMS-managed video data with optional mobile video variants.
 */

export interface VideoData {
  url?: string;
  asset?: {
    url: string;
  };
}

export interface ResponsiveVideoConfig {
  desktop: VideoData | undefined;
  mobile: VideoData | undefined;
  mobileBreakpoint?: number; // Default: 768px
}

/**
 * Extracts URL from video data object
 * Handles both direct URL strings and Sanity asset objects
 */
export const extractVideoUrl = (video: VideoData | undefined | string): string | undefined => {
  if (!video) return undefined;
  if (typeof video === 'string') return video;
  if (video.url) return video.url;
  if (video.asset?.url) return video.asset.url;
  return undefined;
};

/**
 * Extracts URLs from responsive video configuration
 * Returns both desktop and mobile URLs in a normalized format
 */
export const extractResponsiveVideoUrls = (config: ResponsiveVideoConfig) => {
  return {
    desktopUrl: extractVideoUrl(config.desktop),
    mobileUrl: extractVideoUrl(config.mobile),
    mobileBreakpoint: config.mobileBreakpoint || 768
  };
};

/**
 * Creates a responsive video config from CMS data
 * Useful for standardizing video data from different sources
 *
 * @example
 * const config = createResponsiveVideoConfig({
 *   videoUrl: 'https://example.com/desktop.mp4',
 *   videoFile: { asset: { url: 'https://cdn.example.com/video.mp4' } },
 *   mobileVideoUrl: 'https://example.com/mobile.mp4',
 *   mobileVideoFile: { asset: { url: 'https://cdn.example.com/mobile.mp4' } }
 * });
 */
export const createResponsiveVideoConfig = (data: {
  videoUrl?: string;
  videoFile?: VideoData;
  mobileVideoUrl?: string;
  mobileVideoFile?: VideoData;
  mobileBreakpoint?: number;
}): ResponsiveVideoConfig => {
  return {
    desktop: {
      url: data.videoUrl || data.videoFile?.asset?.url
    },
    mobile: {
      url: data.mobileVideoUrl || data.mobileVideoFile?.asset?.url
    },
    mobileBreakpoint: data.mobileBreakpoint
  };
};

/**
 * Gets a video data object that can be passed to the Video component
 * Returns both desktop and mobile URLs along with optional placeholders
 *
 * @example
 * const videoProps = getResponsiveVideoProps({
 *   desktop: { url: 'https://example.com/desktop.mp4' },
 *   mobile: { url: 'https://example.com/mobile.mp4' }
 * }, {
 *   desktopPlaceholder: desktopImage,
 *   mobilePlaceholder: mobileImage
 * });
 */
export const getResponsiveVideoProps = (
  config: ResponsiveVideoConfig,
  placeholders?: {
    desktopPlaceholder?: any;
    mobilePlaceholder?: any;
  }
) => {
  const urls = extractResponsiveVideoUrls(config);

  return {
    desktopUrl: urls.desktopUrl,
    mobileUrl: urls.mobileUrl,
    mobileBreakpoint: urls.mobileBreakpoint,
    placeholder: placeholders?.desktopPlaceholder,
    placeholderMobile: placeholders?.mobilePlaceholder
  };
};

/**
 * Type guard to check if a video object is a valid Sanity asset
 */
export const isSanityAsset = (video: any): video is VideoData => {
  return video && typeof video === 'object' && 'asset' in video && video.asset?.url;
};

/**
 * Type guard to check if a video object is a direct URL string
 */
export const isDirectUrl = (video: any): video is string => {
  return typeof video === 'string' && (video.startsWith('http') || video.startsWith('/'));
};
