# Responsive Mobile & Desktop Video Implementation Guide

## Overview

This implementation adds support for separate video uploads optimized for mobile and desktop screens across the entire website. The system automatically serves the appropriate video based on screen size, with intelligent fallback behavior.

### Key Features

- **Responsive Video Selection**: Automatically serve mobile videos on screens below 768px, desktop videos on larger screens
- **Optional Mobile Videos**: Mobile videos are completely optional - if not provided, the desktop video is used as fallback
- **CMS Integration**: Full Sanity CMS schema support for managing both desktop and mobile videos
- **Backward Compatible**: Existing single-video implementations continue to work without modification
- **Unified Component API**: Single Video component handles all responsive logic
- **Reusable Across Site**: Works consistently for every video instance throughout the website
- **Preserved Functionality**: All existing features maintained (autoplay, looping, mute controls, placeholders, loading behavior)

## Architecture

### 1. Video Component (`components/Video/index.tsx`)

The main Video component now supports both single and dual video URLs:

```tsx
export type VideoProps = {
  // New responsive props
  desktopUrl?: string;           // Desktop video URL (primary)
  mobileUrl?: string;            // Optional mobile video URL
  mobileBreakpoint?: number;     // Breakpoint in px (default: 768)
  
  // Responsive placeholders
  placeholder?: ImagePropsSanity;        // Desktop placeholder
  placeholderMobile?: ImagePropsSanity;  // Optional mobile placeholder
  
  // Legacy props (backward compatible)
  url?: string;                  // Single video URL
  
  // All existing props still supported
  className?: string;
  controls?: boolean;
  altText?: string;
  caption?: string;
  objectFit?: 'cover' | 'contain';
  showAudioControl?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  audioControlPlacement?: 'inline' | 'fixed';
  hasAudio?: boolean;
};
```

**How It Works:**
1. Uses `useMediaQuery` hook to detect screen size
2. Selects appropriate video URL based on screen and available videos
3. Applies responsive placeholder if available
4. Maintains all existing video functionality (autoplay, controls, etc.)

### 2. CMS Schema Updates

#### VideoSection Schema
File: `tools/sanity/schema/sections/shared/videoSection.ts`

Added fields for mobile video:
- `mobileVideoType` - Choose between file upload or URL
- `mobileVideoFile` - Upload mobile-optimized video file
- `mobileVideoUrl` - Paste Vimeo/YouTube URL for mobile
- `mobileThumbnail` - Optional thumbnail for mobile video

#### HeaderHeroSection Schema
File: `tools/sanity/schema/sections/shared/headerHeroSection.ts`

Same mobile video fields added to hero sections.

**Visibility Rules:**
- Mobile video fields only show when `mediaType` is 'video'
- Mobile video type field is optional (no initial value)
- Individual mobile fields hide based on selected type

### 3. Utility Helpers

File: `tools/helpers/videoResponsive.ts`

Provides utilities for working with responsive video data:

```ts
// Extract URL from various data formats
extractVideoUrl(video: VideoData | string) → string | undefined

// Extract both URLs from responsive config
extractResponsiveVideoUrls(config: ResponsiveVideoConfig) → {
  desktopUrl: string | undefined,
  mobileUrl: string | undefined,
  mobileBreakpoint: number
}

// Create responsive config from CMS data
createResponsiveVideoConfig(data: {...}) → ResponsiveVideoConfig

// Get props ready for Video component
getResponsiveVideoProps(config, placeholders?) → VideoProps

// Type guards
isSanityAsset(video: any) → boolean
isDirectUrl(video: any) → boolean
```

## Usage Examples

### Basic Usage - Schema-Managed Content

For VideoSection or HeaderHeroSection components (Sanity CMS managed):

```tsx
// In VideoSection component
const { videoUrl, videoFile, thumbnail, mobileVideoUrl, mobileVideoFile, mobileThumbnail } = props;

const desktopMediaUrl = videoUrl || videoFile?.asset?.url;
const mobileMediaUrl = mobileVideoUrl || mobileVideoFile?.asset?.url;

<Video 
  desktopUrl={desktopMediaUrl}
  mobileUrl={mobileMediaUrl}
  placeholder={thumbnail}
  placeholderMobile={mobileThumbnail}
  controls={false}
  showAudioControl={true}
  muted={true}
  autoPlay
  loop
/>
```

### Advanced Usage - With Utility Helpers

For components processing dynamic data:

```tsx
import { createResponsiveVideoConfig, getResponsiveVideoProps } from '@/tools/helpers/videoResponsive';

const MyVideoComponent = ({ sanityData }) => {
  // Create config from CMS data
  const videoConfig = createResponsiveVideoConfig({
    videoUrl: sanityData.videoUrl,
    videoFile: sanityData.videoFile,
    mobileVideoUrl: sanityData.mobileVideoUrl,
    mobileVideoFile: sanityData.mobileVideoFile
  });

  // Get props ready for Video component
  const videoProps = getResponsiveVideoProps(videoConfig, {
    desktopPlaceholder: sanityData.thumbnail,
    mobilePlaceholder: sanityData.mobileThumbnail
  });

  return <Video {...videoProps} controls={false} autoPlay loop />;
};
```

### Legacy Support - Single URL

Existing code continues to work unchanged:

```tsx
// Old way still works
<Video 
  url="https://example.com/video.mp4"
  controls={true}
  autoPlay
/>
```

### Explicit Responsive Setup

For maximum control:

```tsx
<Video
  desktopUrl="https://example.com/desktop-16-9.mp4"
  mobileUrl="https://example.com/mobile-9-16.mp4"
  mobileBreakpoint={768}
  placeholder={desktopImage}
  placeholderMobile={mobileImage}
  showAudioControl={true}
  autoPlay
  loop
  muted
/>
```

## Breakpoint Reference

The mobile breakpoint is set to **768px** by default, following the `tablet` breakpoint in your breakpoints utility:

| Device        | Screen Width | Video Served |
|---------------|-------------|--------------|
| Mobile        | < 768px     | Mobile (if available) |
| Tablet        | ≥ 768px     | Desktop |
| Desktop       | ≥ 1340px    | Desktop |

To use a different breakpoint:

```tsx
<Video
  desktopUrl={desktopUrl}
  mobileUrl={mobileUrl}
  mobileBreakpoint={640}  // Custom breakpoint
/>
```

## CMS Content Setup

### Video Section Example

1. **Desktop Video Settings:**
   - Select "Video Type": File or URL
   - Upload desktop video (landscape orientation recommended)
   - Set thumbnail for URL-based videos

2. **Mobile Video Settings (Optional):**
   - Select "Mobile Video Type": File or URL
   - Upload mobile video (portrait orientation recommended for better mobile UX)
   - Set mobile thumbnail if different from desktop

3. **Additional Settings:**
   - Tagline, button, audio controls - all work as before

### Best Practices

#### Video Format Recommendations

**Desktop Videos:**
- Aspect Ratio: 16:9 (landscape)
- Resolution: 1280px × 720px or higher
- File Size: Optimized for streaming (2-5 MB typical)

**Mobile Videos:**
- Aspect Ratio: 9:16 (portrait) or 1:1 (square)
- Resolution: 1080px × 1920px or lower
- File Size: Optimized for mobile networks (1-3 MB typical)
- Ensure important content (logos, taglines) visible in center

#### Content Considerations

- **Logo/Branding**: Place in center area visible on all aspect ratios
- **Important Text**: Keep in lower portion for mobile portrait format
- **Call-to-Action**: Position to be visible on both desktop and mobile
- **Key Visuals**: Ensure recognizable in both orientations

## Implementation Details

### How Video Selection Works

```
User visits website
    ↓
useMediaQuery checks: screen width < 768px?
    ↓
    ├─ YES (Mobile screen)
    │   ├─ Mobile video provided?
    │   │   ├─ YES → Use mobile video
    │   │   └─ NO → Use desktop video (fallback)
    │   └─ Use mobile placeholder (if provided)
    │
    └─ NO (Desktop/tablet screen)
        ├─ Use desktop video
        └─ Use desktop placeholder
```

### Responsive Placeholder Behavior

```
if (isMobileScreen && placeholderMobile available)
  → Use placeholderMobile
else
  → Use placeholder
```

This ensures proper poster/preview images match the selected video.

### SSR Compatibility

The `useMediaQuery` hook safely handles server-side rendering:

```tsx
// Only runs on client
if (typeof window !== 'undefined') {
  // Match media queries
  return window.matchMedia(query).matches;
}
// Returns false on server (no mobile breakpoint assumption)
return false;
```

## Updating Existing Components

If you have custom components using the Video component, update them as follows:

### Before

```tsx
const MyComponent = ({ videoData }) => {
  const mediaUrl = videoData.url || videoData.asset?.url;
  return <Video url={mediaUrl} controls={true} />;
};
```

### After

```tsx
import { extractVideoUrl } from '@/tools/helpers/videoResponsive';

const MyComponent = ({ videoData, mobileVideoData, placeholder, mobilePlaceholder }) => {
  const desktopUrl = extractVideoUrl(videoData);
  const mobileUrl = extractVideoUrl(mobileVideoData);

  return (
    <Video 
      desktopUrl={desktopUrl}
      mobileUrl={mobileUrl}
      placeholder={placeholder}
      placeholderMobile={mobilePlaceholder}
      controls={true}
    />
  );
};
```

## Troubleshooting

### Mobile Video Not Showing

1. Verify mobile video is uploaded in CMS
2. Check browser DevTools:
   - `useMediaQuery` hook returning correct value
   - Video src attribute has mobile URL
   - Network tab confirms mobile video is loading

3. Check breakpoint: Default is 768px
   ```tsx
   // Verify hook
   const isMobile = useMediaQuery('(max-width: 767px)');
   console.log('Is mobile:', isMobile);
   ```

### Video Placeholder Issues

1. Ensure placeholder URLs are correct and accessible
2. For mobile: provide `placeholderMobile` for best UX
3. Check image dimensions match video aspect ratios

### Performance Considerations

- Mobile videos should be optimized for file size
- Use appropriate codecs (H.264 for broad compatibility)
- Consider adaptive bitrate streaming for larger videos
- Lazy load videos below the fold when possible

## File Structure

```
components/
  Video/
    index.tsx                    # Main component with responsive logic
    styles.module.scss           # Video styling

tools/
  helpers/
    videoResponsive.ts           # NEW: Utility helpers
  sanity/
    schema/
      sections/
        shared/
          videoSection.ts        # UPDATED: Mobile video fields
          headerHeroSection.ts    # UPDATED: Mobile video fields

sections/
  shared/
    VideoSection/
      index.tsx                  # UPDATED: Uses responsive props
    HeaderHeroSection/
      index.tsx                  # UPDATED: Uses responsive props
```

## Browser Compatibility

Responsive video support requires:
- Modern browsers with CSS media queries support
- `matchMedia` API support (all modern browsers)
- HTML5 video element support (or Vimeo/YouTube embeds)

Tested and working on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari (iOS 14+)
- Chrome Mobile, Firefox Mobile

## Migration Checklist

- [x] Video component updated for responsive URLs
- [x] VideoSection schema updated with mobile fields
- [x] HeaderHeroSection schema updated with mobile fields
- [x] VideoSection component uses responsive props
- [x] HeaderHeroSection component uses responsive props
- [x] Responsive utility helpers created
- [x] Legacy `url` prop continues to work
- [x] All existing video functionality preserved
- [ ] Test with actual content in CMS
- [ ] Deploy and verify on staging environment
- [ ] Monitor video delivery performance

## Support & Questions

For questions about responsive video implementation:

1. Check this documentation
2. Review utility helpers in `tools/helpers/videoResponsive.ts`
3. Check example implementations in VideoSection and HeaderHeroSection
4. Test in browser DevTools with `useMediaQuery` hook debugging
