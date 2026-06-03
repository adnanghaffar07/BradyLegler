'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });
import classNames from '@/helpers/classNames';
import { useMediaQuery } from '@/tools/hooks/useMediaQuery';
import type { ImagePropsSanity } from '../Image';
import LogoMonogram from '@/assets/logo/logo-monogram.svg';

import styles from './styles.module.scss';

export type VideoProps = {
  url?: string;
  desktopUrl?: string;
  mobileUrl?: string;
  mobileBreakpoint?: number;
  className?: string;
  controls?: boolean;
  altText?: string;
  caption?: string;
  placeholder?: ImagePropsSanity;
  placeholderMobile?: ImagePropsSanity;
  objectFit?: 'cover' | 'contain';
  showAudioControl?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  audioControlPlacement?: 'inline' | 'fixed';
  hasAudio?: boolean;
};

function detectVideoPlatform(url?: string) {
  const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/;
  const vimeoPattern = /^(https?:\/\/)?(www\.)?vimeo\.com\/\d+/;

  if (!url) return 'unknown';

  if (youtubePattern.test(url)) {
    return 'youtube';
  } else if (vimeoPattern.test(url)) {
    return 'vimeo';
  } else {
    return 'unknown';
  }
}

const Video = (props: VideoProps) => {
  const {
    url,
    desktopUrl,
    mobileUrl,
    mobileBreakpoint = 768,
    className,
    controls = true,
    altText,
    caption,
    placeholder,
    placeholderMobile,
    objectFit = 'cover',
    showAudioControl = false,
    autoPlay = true,
    loop = true,
    muted = true,
    audioControlPlacement = 'inline',
    hasAudio: hasAudioProp
  } = props;

  // Media query hook to detect mobile screens
  const isMobileScreen = useMediaQuery(`(max-width: ${mobileBreakpoint - 1}px)`);

  // Determine which video URL to use
  const getVideoUrl = (): string | undefined => {
    // If both mobile and desktop URLs are provided, use mobile on small screens
    if (mobileUrl && desktopUrl) {
      return isMobileScreen ? mobileUrl : desktopUrl;
    }
    // Fallback to desktopUrl if only one is provided
    if (desktopUrl) return desktopUrl;
    if (mobileUrl) return mobileUrl;
    // Legacy support for single `url` prop
    return url;
  };

  // Determine which placeholder to use
  const getPlaceholder = (): ImagePropsSanity | undefined => {
    if (isMobileScreen && placeholderMobile) return placeholderMobile;
    return placeholder;
  };

  const effectiveUrl = getVideoUrl();
  const effectivePlaceholder = getPlaceholder();

  const [isMuted, setIsMuted] = useState(muted);
  const [hasAudioState, setHasAudioState] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const hasAudio = typeof hasAudioProp === 'boolean' ? hasAudioProp : hasAudioState;

  useEffect(() => {
    if (typeof hasAudioProp === 'boolean') {
      setHasAudioState(hasAudioProp);
    }
  }, [hasAudioProp]);

  const detectAudio = useCallback(() => {
    if (typeof hasAudioProp === 'boolean') return;

    const video = videoRef.current;
    if (!video) return;

    const audioTracks = (video as any).audioTracks;
    if (audioTracks && typeof audioTracks.length === 'number') {
      setHasAudioState(audioTracks.length > 0);
      return;
    }

    if (typeof (video as any).mozHasAudio === 'boolean') {
      setHasAudioState((video as any).mozHasAudio);
      return;
    }

    if (typeof (video as any).webkitAudioDecodedByteCount === 'number') {
      setHasAudioState((video as any).webkitAudioDecodedByteCount > 0);
      return;
    }

    setHasAudioState(true);
  }, [hasAudioProp]);

  const classes = classNames(styles.container, styles[`object-fit-${objectFit}`], className);
  const videoPlatform = detectVideoPlatform(effectiveUrl);

  useEffect(() => {
    setIsMuted(muted);
  }, [muted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;
    video.defaultMuted = isMuted;
    if (isMuted) {
      video.setAttribute('muted', '');
    } else {
      video.removeAttribute('muted');
    }
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('autoplay', '');
  }, [isMuted]);

  // Safari can ignore declarative autoplay intermittently; retry when media is ready.
  const attemptAutoPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !autoPlay) return;
    try {
      // Keep muted autoplay for Safari policy compliance.
      video.defaultMuted = true;
      video.muted = isMuted;
      video.setAttribute('muted', '');
      video.setAttribute('autoplay', '');
      await video.play();
    } catch {
      // Autoplay may still be blocked by system/browser settings; user can unmute/play manually.
    }
  }, [autoPlay, isMuted]);

  const toggleAudio = useCallback(async () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    const video = videoRef.current;
    if (!video) return;

    video.muted = nextMuted;
    if (!nextMuted) {
      video.volume = 1;
      try {
        await video.play();
      } catch {
        // Ignore blocked play; user can click again.
      }
    }
  }, [isMuted]);

  const handleAudioToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    void toggleAudio();
  };

  const markReady = () => {
    if (!isReady) {
      setIsReady(true);
    }
  };

  const markError = () => {
    setHasError(true);
  };

  const hasPlaceholderImage = Boolean(effectivePlaceholder?.asset?.url);

  const renderPlaceholder = () => (
    <div className={styles.placeholder}>
      {hasPlaceholderImage ? (
        <img
          src={effectivePlaceholder?.asset?.url}
          alt={effectivePlaceholder?.altText || altText || 'Video placeholder'}
          className={styles.placeholderImage}
        />
      ) : (
        <LogoMonogram className={styles.placeholderLogo} aria-hidden="true" />
      )}
    </div>
  );

  const renderAudioControl = () => {
    if (!showAudioControl || !hasAudio) return null;

    const audioControlClass = classNames(styles.audioControl, {
      [styles.audioControlFixed]: audioControlPlacement === 'fixed'
    });

    return (
      <button
        type="button"
        className={audioControlClass}
        onClick={handleAudioToggle}
        aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <img src="/sound-off.png" alt="Muted" className={styles.icon} />
        ) : (
          <img src="/sound-on.png" alt="Unmuted" className={styles.icon} />
        )}
      </button>
    );
  };

  if (videoPlatform === 'youtube') {
    return (
      <div className={classNames(styles.videoWrapper, styles.youtubeWrapper, { [styles.withAudioControl]: showAudioControl })}>
        {hasError && renderPlaceholder()}
        <ReactPlayer
          url={effectiveUrl}
          title={altText}
          width="100%"
          height="100%"
          controls={controls}
          playing={autoPlay}
          muted={isMuted}
          onReady={markReady}
          onError={markError}
          config={{ file: { attributes: { preload: 'auto', playsInline: true } } }}
        />
        {showAudioControl && renderAudioControl()}
      </div>
    );
  }

  if (videoPlatform === 'vimeo') {
    return (
      <div className={classNames(styles.videoWrapper, styles.vimeoWrapper, { [styles.withAudioControl]: showAudioControl })}>
        {hasError && renderPlaceholder()}
        <ReactPlayer
          url={effectiveUrl}
          title={altText}
          width="100%"
          height="100%"
          controls={controls}
          playing={autoPlay}
          muted={isMuted}
          onReady={markReady}
          onError={markError}
          config={{ file: { attributes: { preload: 'auto', playsInline: true } } }}
        />
        {showAudioControl && renderAudioControl()}
      </div>
    );
  }

  if (videoPlatform === 'unknown') {
    return (
      <div className={classNames(styles.videoWrapper, { [styles.withAudioControl]: showAudioControl })}>
        {hasError && renderPlaceholder()}
        <video
          ref={videoRef}
          className={classes}
          src={effectiveUrl}
          title={altText}
          controls={showAudioControl ? false : controls}
          controlsList={showAudioControl ? 'nodownload noplaybackrate nofullscreen noremoteplayback' : undefined}
          playsInline
          preload="auto"
          poster={effectivePlaceholder?.asset?.url}
          loop={loop}
          autoPlay={autoPlay}
          muted={isMuted}
          disablePictureInPicture={showAudioControl}
          onError={markError}
          onLoadedMetadata={() => {
            detectAudio();
            void attemptAutoPlay();
            markReady();
          }}
          onLoadedData={() => {
            detectAudio();
            void attemptAutoPlay();
            markReady();
          }}
          onCanPlay={() => {
            detectAudio();
            void attemptAutoPlay();
            markReady();
          }}
          onCanPlayThrough={() => {
            void attemptAutoPlay();
            markReady();
          }}
        />
        {showAudioControl && renderAudioControl()}
      </div>
    );
  }

  return null;
};

export default Video;
