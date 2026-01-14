import React from 'react';
import { SanityFileAsset } from '@sanity/asset-utils';
import styles from './styles.module.scss';
import classNames from '@/helpers/classNames';
import Image from 'next/image';

type MediaProps = {
  enable: boolean;
  type: 'video' | 'image';
  image?: SanityImage;
  video?: {
    asset: SanityFileAsset;
  };
  size?: 'centered' | 'full';
  className?: string;
};

const Media: React.FC<MediaProps> = props => {
  const { type, enable = true, video, image, size = 'centered', className } = props;
  if (!enable) return null;

  const classes = classNames(styles.container, styles[`size_${size}`], className);

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
    const { asset, altText } = image;
    const { width, height } = asset.metadata.dimensions;
    return (
      <div className={classes}>
        <Image
          key={asset.url}
          src={image.asset.url}
          width={width}
          height={height}
          alt={altText || 'Brady Legler'}
          priority
          className={styles.media}
        />
      </div>
    );
  }

  // return <div>MEDIA</div>;
};

export default Media;
