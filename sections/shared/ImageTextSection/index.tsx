import React from 'react';
import Section from '@/components/Section';
import Layout from '@/components/Layout';
import Image from '@/components/Image';
import TextBlock from '@/components/TextBlock';
import Link from '@/components/Link';
import classNames from '@/tools/helpers/classNames';
import styles from './styles.module.scss';

interface IImageTextSection {
  image: any;
  textBlock: any;
  addButton?: boolean;
  button?: any;
  invertLayout?: boolean;
  className?: string;
}

const ImageTextSection: React.FC<IImageTextSection> = ({ image, textBlock, addButton, button, invertLayout = false, className }) => {
  const layoutVariant = invertLayout ? 'rightLargeFullWidth' : 'leftLargeFullWidth';

  const imageDiv = (
    <div className={styles.imageSide}>
      <Image {...image} className={styles.image} aspectRatio="natural" objectFit="cover" />
    </div>
  );

  const textDiv = (
    <div className={styles.textSide}>
      <TextBlock blocks={textBlock} className={styles.textBlock} />
      {addButton && button?.link && (
        <Link {...button.link} variant="normal-sm" className={styles.button}>
          {button.label}
        </Link>
      )}
    </div>
  );

  return (
    <Section name="ImageTextSection" theme="light-dark" full removeTopSpacing removeBottomSpacing className={className}>
      <Layout variant={layoutVariant} className={styles.container}>
        {invertLayout ? (
          <>
            {textDiv}
            {imageDiv}
          </>
        ) : (
          <>
            {imageDiv}
            {textDiv}
          </>
        )}
      </Layout>
    </Section>
  );
};

export default ImageTextSection;
