'use client';

import React, { useState } from 'react';
import Section from '@/components/Section';
import Text from '@/components/Text';
import Image from '@/components/Image';
import Layout from '@/components/Layout';
import Link from '@/components/Link';
import classNames from '@/tools/helpers/classNames';
import { getSectionSpacingProps } from '@/tools/helpers/section';
import { IFullscreenImageSection } from '@/tools/sanity/schema/sections/shared/fullScreenImageSection';
import styles from './styles.module.scss';

const FullscreenImageSection: React.FC<IFullscreenImageSection> = props => {
  const { addButton, button, image } = props;

  const [isHover, setIsHover] = useState(false);

  return (
    <Section
      name="FullscreenImageSection"
      full
      removeBottomSpacing
      removeTopSpacing
      className={classNames(styles.section, { [styles.hover]: isHover })}
      theme="light"
      {...getSectionSpacingProps(props)}
    >
      <Layout variant="fullWidth" className={styles.layout}>
        <div className={styles.containerSticky}>
          {addButton && (
            <Link
              {...button?.link}
              className={styles.button}
              variant="square-overlay-light"
              onMouseOver={() => setIsHover(true)}
              onMouseLeave={() => setIsHover(false)}
            >
              <Text text={button?.label} weight="medium" />
            </Link>
          )}
        </div>
      </Layout>

      <div className={styles.background}>
        <Image
          {...image}
          className={styles.bgImage}
          priority
          quality={82}
          sizes="100vw"
        />
      </div>
    </Section>
  );
};

export default FullscreenImageSection;
