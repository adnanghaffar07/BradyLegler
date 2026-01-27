'use client';

import React from 'react';
import Image from 'next/image';
import SanityImage from '@/components/Image'; // Import our Sanity Image component
import Section from '@/components/Section';
import Layout from '@/components/Layout';
import TextBlock from '@/components/TextBlock';
import classNames from '@/helpers/classNames';
import { ICollectionDocument } from '@/tools/sanity/schema/documents/collection';
import styles from './styles.module.scss';
import Button from '@/components/Button';
import Link from '@/components/Link';

const Media: React.FC<{
  type: 'video' | 'image';
  image?: SanityImage;
  video?: {
    asset: {
      url: string;
    };
  };
  className?: string;
}> = props => {
  const { type, video, image, className } = props;

  const classes = classNames(styles.media, className);

  if (type === 'video' && video) {
    return (
      <div className={classes}>
        <video
          src={video.asset.url}
          controls={false}
          muted={true}
          playsInline={true}
          autoPlay={true}
          loop={true}
          className={styles.media}
        />
      </div>
    );
  }

  if (type === 'image' && image) {
    return (
      <div className={classes}>
        <SanityImage
          {...image}
          fill
          priority
          className={styles.media}
          objectFit="cover"
        />
      </div>
    );
  }

  return null;
};

const Header = ({ sanityCollectionData }: { sanityCollectionData: ICollectionDocument }) => {
  const { collectionHeader } = sanityCollectionData || {};
  const { mediaOne, mediaTwo, addButton, tagline, button, layout, logoTheme, quote } = collectionHeader || {};

  return (
    <>
      <Section
        className={classNames(styles.header, styles[`layout_${layout}`])}
        full
        spacing="none"
        removeBottomSpacing
        removeTopSpacing
      >
        <Layout variant={layout === 'split' ? 'leftLargeFullWidth' : 'fullWidth'} className={styles.container}>
          {(layout === 'split' || layout === 'fullWidth') && (
            <div className={styles.mediaContainer}>
              {mediaOne && <Media type={mediaOne.mediaType} image={mediaOne.image} video={mediaOne.video} />}
            </div>
          )}

          {layout === 'split' && (
            <div className={styles.mediaContainer}>
              {mediaTwo && <Media type={mediaTwo.mediaType} image={mediaTwo.image} video={mediaTwo.video} />}
            </div>
          )}

          {layout === 'text' && (
            <div className={styles.textContainer}>
              <TextBlock
                config={{
                  p: {
                    size: 'b1'
                  }
                }}
                blocks={quote}
              />
            </div>
          )}
        </Layout>

        {/* Wrapper for tagline + button in a column */}
        <div className={styles.overlayContent}>
          {tagline && <p className={styles.tagline}>{tagline}</p>}
          {addButton && button?.link && (
            <div className={styles.buttonContainer}>
              <Link {...button.link} variant="square-overlay" text={button.label} />
            </div>
          )}
        </div>
      </Section>
      <Section className={styles.spacer} theme="light" removeBottomSpacing removeTopSpacing spacing="none">
        <div />
      </Section>
    </>
  );
};

export default Header;
