// HeaderHeroSection.tsx
'use client';

import React, { useState } from 'react';
import Section from '@/components/Section';
import Text from '@/components/Text';
import Image from '@/components/Image';
import Video from '@/components/Video';
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
    thumbnail,
    mobileVideoType,
    mobileVideoFile,
    mobileVideoUrl,
    mobileThumbnail
  } = props;

  const [isHover, setIsHover] = useState(false);

  const desktopMediaUrl = videoUrl || videoFile?.asset?.url;
  const mobileMediaUrl = mobileVideoUrl || mobileVideoFile?.asset?.url;

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
      {mediaType === 'image' && image && (
        <Image
          {...image}
          className={styles.bgImage}
          priority
          quality={82}
          sizes="100vw"
        />
      )}

      {mediaType === 'video' && desktopMediaUrl && (
        <div className={styles.videoContainer}>
          <Video
            desktopUrl={desktopMediaUrl}
            mobileUrl={mobileMediaUrl}
            controls={false}
            altText={tagline}
            placeholder={thumbnail}
            placeholderMobile={mobileThumbnail}
            objectFit="cover"
            showAudioControl
            muted
            autoPlay
            loop
          />
        </div>
      )}

      {/* Content Overlay */}
      <Layout variant="fullWidth" className={styles.layout}>
        <div className={styles.containerSticky}>
          <div className={styles.contentGroup}>
            {tagline && <h2 className={styles.tagline} >{tagline}</h2>}

            {addButton && button && (
              <div
                className={styles.buttonContainer}
                onMouseOver={() => setIsHover(true)}
                onMouseLeave={() => setIsHover(false)}
              >
                <Link
                  {...button.link}
                  className={styles.button}
                  variant="square-overlay-light"
                >
                  <Text text={button.label} weight="medium" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </Section>
  );
};

export default HeaderHeroSection;
