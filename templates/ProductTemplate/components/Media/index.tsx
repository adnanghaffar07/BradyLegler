import React from 'react';
import { SanityFileAsset } from '@sanity/asset-utils';
import styles from './styles.module.scss';
import classNames from '@/helpers/classNames';
import Image from '@/components/Image';

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
    const { asset, altText, crop, hotspot } = image as any;
    return (
      <div className={classes}>
        <Image
          key={asset.url}
          asset={asset}
          crop={crop}
          hotspot={hotspot}
          altText={altText || 'Brady Legler'}
          sizes="100vw"
          priority
          className={styles.media}
        />
      </div>
    );
  }

  // return <div>MEDIA</div>;
};

export default Media;
