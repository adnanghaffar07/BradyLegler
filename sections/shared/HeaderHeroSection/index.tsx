// HeaderHeroSection.tsx
'use client';

import React, { useState } from 'react';
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
  const mediaUrl = videoUrl || videoFile?.asset?.url;

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
            src={mediaUrl}
            className={styles.videoElement}
            loop
            muted
            playsInline
            autoPlay
            poster={thumbnail?.asset?.url}
          />
        </div>
      )}

      {/* Content Overlay */}
      <Layout variant="fullWidth" className={styles.layout}>
        <div className={styles.containerSticky}>
          <div className={styles.contentGroup}>
            {tagline && <Text text={tagline} className={styles.tagline} weight="regular" size="lg" />}

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
