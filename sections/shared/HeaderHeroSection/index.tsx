// HeaderHeroSection.tsx
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Section from '@/components/Section';
import Text from '@/components/Text';
import Image from '@/components/Image';
import Layout from '@/components/Layout';
import Link from '@/components/Link';
import classNames from '@/tools/helpers/classNames';
import { getSectionSpacingProps } from '@/tools/helpers/section';
import { IHeaderHeroSection } from '@/tools/sanity/schema/sections/shared/headerHeroSection';
import styles from './styles.module.scss';

const HeaderHeroSection: React.FC<IHeaderHeroSection> = props => {
  const { addButton, button, image, tagline, mediaType = 'image', videoType, videoFile, videoUrl, thumbnail } = props;

  const [isHover, setIsHover] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const mediaUrl = videoUrl || videoFile?.asset?.url;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const attemptAutoPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
    try {
      await video.play();
    } catch {
      // Autoplay may still be blocked by system/browser settings; user can unmute/play manually.
    }
  }, [isMuted]);

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

  return (
    <Section
      name="HeaderHeroSection"
      full
      removeBottomSpacing
      removeTopSpacing
      className={classNames(styles.section, {
        [styles.hover]: isHover
      })}
      theme="light"
      containerClassName={styles.container}
      {...getSectionSpacingProps(props)}
    >
      {/* Media Background - Full width */}
      {mediaType === 'image' && image && <Image {...image} className={styles.bgImage} />}

      {mediaType === 'video' && mediaUrl && (
        <div className={styles.videoContainer}>
          <video
            ref={videoRef}
            src={mediaUrl}
            className={styles.videoElement}
            loop
            muted={isMuted}
            controls={false}
            playsInline
            autoPlay
            poster={thumbnail?.asset?.url}
            onLoadedMetadata={() => {
              void attemptAutoPlay();
            }}
            onCanPlay={() => {
              void attemptAutoPlay();
            }}
          />
          <button
            type="button"
            className={styles.audioControl}
            onClick={handleAudioToggle}
          >
            🔊
          </button>
        </div>
      )}

      {/* Content Overlay */}
      <Layout variant="fullWidth" className={styles.layout}>
        <div className={styles.containerSticky}>
          <div className={styles.contentGroup}>
            {tagline && <Text text={tagline} className={styles.tagline} weight="regular" />}

            {addButton && button && (
              <Link
                {...button.link}
                className={styles.button}
                variant="square-overlay-light"
                onMouseOver={() => setIsHover(true)}
                onMouseLeave={() => setIsHover(false)}
              >
                <Text text={button.label} weight="medium" />
              </Link>
            )}
          </div>
        </div>
      </Layout>
    </Section>
  );
};

export default HeaderHeroSection;
