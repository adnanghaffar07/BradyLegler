'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });
import classNames from '@/helpers/classNames';
import type { ImagePropsSanity } from '../Image';
import LogoMonogram from '@/assets/logo/logo-monogram.svg';

import styles from './styles.module.scss';

export type VideoProps = {
  url?: string;
  className?: string;
  controls?: boolean;
  altText?: string;
  caption?: string;
  placeholder?: ImagePropsSanity;
  objectFit?: 'cover' | 'contain';
  showAudioControl?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
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
    className,
    controls = true,
    altText,
    caption,
    placeholder,
    objectFit = 'cover',
    showAudioControl = false,
    autoPlay = true,
    loop = true,
    muted = true
  } = props;
  const [isMuted, setIsMuted] = useState(muted);
  const [isReady, setIsReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const classes = classNames(styles.container, styles[`object-fit-${objectFit}`], className, {
    [styles.loading]: !isReady
  });
  const videoPlatform = detectVideoPlatform(url);

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

  const hasPlaceholderImage = Boolean(placeholder?.asset?.url);

  const renderPlaceholder = () => (
    <div className={styles.placeholder}>
      {hasPlaceholderImage ? (
        <img
          src={placeholder?.asset?.url}
          alt={placeholder?.altText || altText || 'Video placeholder'}
          className={styles.placeholderImage}
        />
      ) : (
        <LogoMonogram className={styles.placeholderLogo} aria-hidden="true" />
      )}
    </div>
  );

  const renderAudioControl = () => (
    <button
      type="button"
      className={styles.audioControl}
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

  if (videoPlatform === 'youtube') {
    return (
      <div className={classNames(styles.videoWrapper, styles.youtubeWrapper, { [styles.withAudioControl]: showAudioControl })}>
        {!isReady && renderPlaceholder()}
        <ReactPlayer
          url={url}
          title={altText}
          width="100%"
          height="100%"
          controls={controls}
          playing={autoPlay}
          muted={isMuted}
          onReady={markReady}
          config={{ file: { attributes: { preload: 'auto' } } }}
        />
        {showAudioControl && renderAudioControl()}
      </div>
    );
  }

  if (videoPlatform === 'vimeo') {
    return (
      <div className={classNames(styles.videoWrapper, styles.vimeoWrapper, { [styles.withAudioControl]: showAudioControl })}>
        {!isReady && renderPlaceholder()}
        <ReactPlayer
          url={url}
          title={altText}
          width="100%"
          height="100%"
          controls={controls}
          playing={autoPlay}
          muted={isMuted}
          onReady={markReady}
          config={{ file: { attributes: { preload: 'auto' } } }}
        />
        {showAudioControl && renderAudioControl()}
      </div>
    );
  }

  if (videoPlatform === 'unknown') {
    return (
      <div className={classNames(styles.videoWrapper, { [styles.withAudioControl]: showAudioControl })}>
        {!isReady && renderPlaceholder()}
        <video
          ref={videoRef}
          className={classes}
          src={url}
          title={altText}
          controls={showAudioControl ? false : controls}
          controlsList={showAudioControl ? 'nodownload noplaybackrate nofullscreen noremoteplayback' : undefined}
          playsInline
          preload="auto"
          loop={loop}
          autoPlay={autoPlay}
          muted={isMuted}
          disablePictureInPicture={showAudioControl}
          onLoadedMetadata={() => {
            void attemptAutoPlay();
            markReady();
          }}
          onLoadedData={() => {
            void attemptAutoPlay();
            markReady();
          }}
          onCanPlay={() => {
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
