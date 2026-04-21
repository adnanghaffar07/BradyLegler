'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });
import classNames from '@/helpers/classNames';
import Image, { ImagePropsSanity } from '../Image';

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
  const videoRef = useRef<HTMLVideoElement>(null);

  const classes = classNames(styles.container, styles[`object-fit-${objectFit}`], className);
  const videoPlatform = detectVideoPlatform(url);

  useEffect(() => {
    setIsMuted(muted);
  }, [muted]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.setAttribute('playsinline', '');
      videoRef.current.setAttribute('webkit-playsinline', '');
    }
  }, [isMuted]);

  // Safari can ignore declarative autoplay intermittently; retry when media is ready.
  const attemptAutoPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !autoPlay) return;
    try {
      // Keep muted autoplay for Safari policy compliance.
      video.muted = isMuted;
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

  if (videoPlatform === 'youtube') {
    return (
      <div className={styles.youtubeWrapper}>
        <ReactPlayer url={url} title={altText} width="100%" height="100%" controls={controls} />
      </div>
    );
  }

  if (videoPlatform === 'vimeo') {
    return (
      <div className={styles.vimeoWrapper}>
        <ReactPlayer url={url} title={altText} width="100%" height="100%" controls={controls} />
      </div>
    );
  }

  if (videoPlatform === 'unknown') {
    return (
      <div className={classNames(styles.videoWrapper, { [styles.withAudioControl]: showAudioControl })}>
        <video
          ref={videoRef}
          className={classes}
          src={url}
          title={altText}
          controls={showAudioControl ? false : controls}
          controlsList={showAudioControl ? 'nodownload noplaybackrate nofullscreen noremoteplayback' : undefined}
          playsInline
          preload="metadata"
          loop={loop}
          autoPlay={autoPlay}
          muted={isMuted}
          defaultMuted={muted}
          disablePictureInPicture={showAudioControl}
          onLoadedMetadata={() => {
            void attemptAutoPlay();
          }}
          onLoadedData={() => {
            void attemptAutoPlay();
          }}
          onCanPlay={() => {
            void attemptAutoPlay();
          }}
          onCanPlayThrough={() => {
            void attemptAutoPlay();
          }}
        />
        {showAudioControl && (
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
        )}
      </div>
    );
  }

  return null;
};

export default Video;
