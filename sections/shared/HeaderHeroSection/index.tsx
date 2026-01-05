// HeaderHeroSection.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  const { 
    addButton, 
    button, 
    image, 
    tagline,
    mediaType = 'image',
    videoType,
    videoFile,
    videoUrl,
    thumbnail 
  } = props;

  const [isHover, setIsHover] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Determine video source
  const getVideoSource = () => {
    if (mediaType !== 'video') return null;
    
    if (videoType === 'file' && videoFile?.asset?.url) {
      return videoFile.asset.url;
    }
    
    if (videoType === 'url' && videoUrl) {
      return videoUrl;
    }
    
    return null;
  };

  const videoSource = getVideoSource();

  // Handle video autoplay
  useEffect(() => {
    if (videoRef.current && videoSource) {
      // Try to autoplay video
      const playVideo = async () => {
        try {
          await videoRef.current!.play();
        } catch (err) {
          // Autoplay was prevented
          console.log('Autoplay prevented:', err);
        }
      };
      
      playVideo();
    }
  }, [videoSource]);

  return (
    <Section
      name="HeaderHeroSection"
      full
      removeBottomSpacing
      removeTopSpacing
      className={classNames(styles.section, { [styles.hover]: isHover })}
      theme="light"
      {...getSectionSpacingProps(props)}
    >
      <Layout variant="fullWidth" className={styles.layout}>
        <div className={styles.containerSticky}>
          {tagline && <Text text={tagline} className={styles.tagline} weight="regular" size="lg" />}

          {addButton && (
            <Link
              {...button?.link}
              className={styles.button}
              variant="square-overlay-light"
              onMouseOver={() => setIsHover(true)}
              onMouseLeave={() => setIsHover(false)}
            >
              <Text text={button?.label} weight="medium" />
            </Link>
          )}
        </div>
      </Layout>

      <div className={styles.background}>
        {mediaType === 'image' && image && (
          <Image {...image} className={styles.bgImage} />
        )}
        
        {mediaType === 'video' && videoSource && (
          <div >
            <video
              ref={videoRef}
              src={videoSource}
              className={styles.bgImage}
              loop
              muted
              playsInline
              poster={thumbnail?.asset?.url}
              controls={false}
            />
            <div className={styles.videoOverlay} />
          </div>
        )}
      </div>
    </Section>
  );
};

export default HeaderHeroSection;