'use client';

import React, { useState } from 'react';
import Section from '@/components/Section';
import { IVideoSection } from '@/tools/sanity/schema/sections/shared/videoSection';
import Video from '@/components/Video';
import Layout from '@/components/Layout';
import Link from '@/components/Link';
import Text from '@/components/Text';
import classNames from '@/helpers/classNames';
import styles from './styles.module.scss';

const VideoSection: React.FC<IVideoSection> = props => {
  const { videoUrl, videoFile, thumbnail, tagline, addButton, button } = props;
  const mediaUrl = videoUrl || videoFile?.asset?.url;
  const [isHover, setIsHover] = useState(false);

  return (
    <Section
      name="VideoSection"
      full
      removeBottomSpacing
      removeTopSpacing
      className={classNames(styles.section, { [styles.hover]: isHover })}
      theme="light"
      containerClassName={styles.container}
    >
      <Video url={mediaUrl} controls={false} showAudioControl={true} muted={true} autoPlay loop />

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

export default VideoSection;