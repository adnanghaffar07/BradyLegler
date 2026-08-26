'use client';

import React from 'react';
import Text from '@/components/Text';
import { Metal, Stone, STONE_GRADIENT, METAL_GRADIENT } from './constants';
import styles from './SubwayRingImage.module.scss';

type SubwayRingImageProps = {
  metal: Metal;
  topStone: Stone;
  bottomStone: Stone;
};

const SubwayRingImage: React.FC<SubwayRingImageProps> = ({ metal, topStone, bottomStone }) => {
  const band = METAL_GRADIENT[metal];
  const top = STONE_GRADIENT[topStone];
  const bottom = STONE_GRADIENT[bottomStone];

  return (
    <div className={styles.imagePanel}>
      <svg width="100%" height="100%" viewBox="0 0 420 420" className={styles.illustration}>
        <defs>
          <linearGradient id="customizerBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={band.from} />
            <stop offset="45%" stopColor={band.mid} />
            <stop offset="100%" stopColor={band.to} />
          </linearGradient>
          <radialGradient id="customizerTopGem" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor={top.from} />
            <stop offset="55%" stopColor={top.mid} />
            <stop offset="100%" stopColor={top.to} />
          </radialGradient>
          <radialGradient id="customizerBottomGem" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor={bottom.from} />
            <stop offset="55%" stopColor={bottom.mid} />
            <stop offset="100%" stopColor={bottom.to} />
          </radialGradient>
          <filter id="customizerShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000000" floodOpacity="0.16" />
          </filter>
        </defs>

        <g filter="url(#customizerShadow)">
          <rect x="40" y="95" width="340" height="62" rx="31" fill="url(#customizerBand)" />
          <rect x="40" y="95" width="340" height="62" rx="31" fill="none" stroke={band.stroke} strokeWidth="1" opacity="0.35" />
          <rect x="40" y="223" width="340" height="62" rx="31" fill="url(#customizerBand)" />
          <rect x="40" y="223" width="340" height="62" rx="31" fill="none" stroke={band.stroke} strokeWidth="1" opacity="0.35" />
          <rect x="194" y="150" width="32" height="80" rx="5" fill={band.mid} />
          <rect x="194" y="150" width="32" height="80" rx="5" fill="none" stroke={band.stroke} strokeWidth="1" opacity="0.4" />
          <line x1="202" y1="168" x2="218" y2="168" stroke={band.stroke} strokeWidth="1" opacity="0.5" />
          <line x1="202" y1="212" x2="218" y2="212" stroke={band.stroke} strokeWidth="1" opacity="0.5" />
        </g>

        {[94, 140, 186].map(cx => (
          <g key={`top-${cx}`}>
            <circle cx={cx} cy="126" r="15" fill="url(#customizerTopGem)" />
            <circle cx={cx} cy="126" r="15" fill="none" stroke={band.stroke} strokeWidth="1" opacity="0.3" />
            <circle cx={cx - 8} cy="119" r="3.4" fill="#FFFFFF" opacity="0.9" />
          </g>
        ))}

        {[234, 280, 326].map(cx => (
          <g key={`bottom-${cx}`}>
            <circle cx={cx} cy="254" r="15" fill="url(#customizerBottomGem)" />
            <circle cx={cx} cy="254" r="15" fill="none" stroke={band.stroke} strokeWidth="1" opacity="0.3" />
            <circle cx={cx - 8} cy="247" r="3.4" fill="#FFFFFF" opacity="0.75" />
          </g>
        ))}
      </svg>

      <div className={styles.zoneCaptions}>
        <Text as="span" size="b3" className={styles.zoneCaption} text={`Top band · ${topStone}`} />
        <Text as="span" size="b3" className={styles.zoneCaption} text={`Bottom band · ${bottomStone}`} />
      </div>
    </div>
  );
};

export default SubwayRingImage;
