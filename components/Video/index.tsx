'use client';

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
  const { url, className, controls = true, altText, caption, placeholder, objectFit = 'cover' } = props;

  const classes = classNames(styles.container, styles[`object-fit-${objectFit}`], className);
  const videoPlatform = detectVideoPlatform(url);

  if (videoPlatform === 'youtube') {
    return (
      <div className={styles.youtubeWrapper}>
        <ReactPlayer url={url} title={altText} classes controls={controls} />
      </div>
    );
  }

  if (videoPlatform === 'vimeo') {
    return (
      <div className={styles.vimeoWrapper}>
        <ReactPlayer url={url} title={altText} classes controls={controls} />
      </div>
    );
  }

  if (videoPlatform === 'unknown') {
    return (
      <ReactPlayer
        className={classes}
        url={url}
        title={altText}
        controls={controls}
        playsinline={true}
        loop={true}
        playing
        muted={false}
      />
    );
  }

  return null;
};

export default Video;
