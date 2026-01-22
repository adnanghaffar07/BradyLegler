import React from 'react';
import { ISpacerSection } from '@/tools/sanity/schema/sections/shared/spacerSection';
import styles from './styles.module.scss';

const SpacerSection: React.FC<ISpacerSection> = props => {
  const { height = 24, mobileHeight = 24, useSeparateMobileSpacing = false } = props;

  return (
    <div 
      className={styles.spacer}
      style={{
        '--desktop-height': `${height}px`,
        '--mobile-height': useSeparateMobileSpacing ? `${mobileHeight}px` : `${height}px`
      } as React.CSSProperties}
    />
  );
};

export default SpacerSection;
