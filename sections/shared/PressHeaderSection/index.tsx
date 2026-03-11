// PressHeaderSection.tsx
'use client';

import React from 'react';
import Section from '@/components/Section';
import Image from '@/components/Image';
import classNames from '@/tools/helpers/classNames';
import { getSectionSpacingProps } from '@/tools/helpers/section';
import styles from './styles.module.scss';

interface IPressHeaderSection {
  image?: any;
  removeBottomSpacing?: boolean;
  removeTopSpacing?: boolean;
  spacing?: any;
}

const PressHeaderSection: React.FC<IPressHeaderSection> = props => {
  const { image } = props;

  return (
    <Section
      name="PressHeaderSection"
      full
      removeBottomSpacing
      removeTopSpacing
      className={styles.section}
      theme="light"
      containerClassName={styles.container}
      {...getSectionSpacingProps(props)}
    >
      {/* Full-height image display without cropping */}
      {image && <Image {...image} className={styles.pressImage} />}
    </Section>
  );
};

export default PressHeaderSection;
