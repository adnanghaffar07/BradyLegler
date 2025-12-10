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
  const { addButton, button, image, tagline } = props;

  const [isHover, setIsHover] = useState(false);

  return (
    <Section
      name="HeaderHeroSection"
      full
      removeBottomSpacing
      removeTopSpacing
      className={classNames(styles.section, { [styles.hover]: isHover })}
      theme="light"
      {...getSectionSpacingProps(props)}
    >
      <Layout variant="fullWidth" className={styles.layout}>
        <div className={styles.containerSticky}>
          {/* Show tagline above the button */}
          {tagline && <Text text={tagline} className={styles.tagline} weight="regular" size="lg" />}

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
        <Image {...image} className={styles.bgImage} />
      </div>
    </Section>
  );
};

export default HeaderHeroSection;
