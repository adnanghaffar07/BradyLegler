'use client';

import React, { useState } from 'react';
import Section from '@/components/Section';
import { IVideoSection } from '@/tools/sanity/schema/sections/shared/videoSection';
import Video from '@/components/Video';
import styles from './styles.module.scss';
import Layout from '@/components/Layout';
import Link from '@/components/Link';
import Text from '@/components/Text';
import classNames from '@/helpers/classNames';

const VideoSection: React.FC<IVideoSection> = props => {
  const { videoType, videoUrl, thumbnail, videoFile, addButton, button } = props;
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
      <Video url={mediaUrl} controls={false} />

      <Layout variant="fullWidth" className={styles.layout}>
        <div className={styles.containerSticky}>
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
      </Layout>
    </Section>
  );
};

export default VideoSection;
