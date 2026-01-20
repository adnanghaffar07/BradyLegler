'use client';

import React, { useState } from 'react';
import Section from '@/components/Section';
import Image from '@/components/Image';
import { IImageCenteredSection } from '@/tools/sanity/schema/sections/shared/imageCenteredSection';
import Link from '@/components/Link';
import classNames from '@/tools/helpers/classNames';
import styles from './styles.module.scss';

const ImageCenteredSection: React.FC<IImageCenteredSection> = props => {
  const { image, addButton, button, layout = 'small' } = props;

  const [isHover, setIsHover] = useState(false);

  const imageComponent = image?.asset?.url ? <Image {...image} className={styles.image} /> : null;

  const handleMouseOver = (status: boolean) => {
    if (!addButton) return;
    setIsHover(status);
  };

  return (
    <Section className='section' name="ImageCenteredSection" theme="dark" full removeBottomSpacing removeTopSpacing>
      <div
        className={classNames(styles.container, styles[`layout-${layout || 'small'}`], {
          [styles.hover]: isHover
        })}
      >
        <div onMouseOver={() => handleMouseOver(true)} onMouseLeave={() => handleMouseOver(false)}>
          {addButton && button?.link ? (
            <Link {...button?.link} className={styles.buttonImage} variant="content">
              {imageComponent}
            </Link>
          ) : (
            imageComponent
          )}
        </div>

        {addButton && button?.link && (
          <div onMouseOver={() => handleMouseOver(true)} onMouseLeave={() => handleMouseOver(false)}>
            <Link {...button?.link} className={styles.button} variant={'normal-sm'} text={button?.label} />
          </div>
        )}
      </div>
    </Section>
  );
};

export default ImageCenteredSection;
