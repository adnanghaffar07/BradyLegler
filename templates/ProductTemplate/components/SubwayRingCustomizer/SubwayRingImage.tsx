'use client';

import React from 'react';
import Text from '@/components/Text';
import { Metal, Stone, STONE_GRADIENT, METAL_GRADIENT } from './constants';
import styles from './SubwayRingImage.module.scss';

type SubwayRingImageProps = {
  metal: Metal;
  sideOneTopStone: Stone;
  sideTwoTopStone: Stone;
  sideOneBottomStone: Stone;
  sideTwoBottomStone: Stone;
};

const SubwayRingImage: React.FC<SubwayRingImageProps> = ({
  metal,
  sideOneTopStone,
  sideTwoTopStone,
  sideOneBottomStone,
  sideTwoBottomStone
}) => {
  const band = METAL_GRADIENT[metal];
  const sideOneTop = STONE_GRADIENT[sideOneTopStone];
  const sideTwoTop = STONE_GRADIENT[sideTwoTopStone];
  const sideOneBottom = STONE_GRADIENT[sideOneBottomStone];
  const sideTwoBottom = STONE_GRADIENT[sideTwoBottomStone];

  return (
    <div className={styles.imagePanel}>
      <svg width="100%" height="100%" viewBox="0 0 420 420" className={styles.illustration}>
        <defs>
          <linearGradient id="customizerBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={band.from} />
            <stop offset="45%" stopColor={band.mid} />
            <stop offset="100%" stopColor={band.to} />
          </linearGradient>
          <radialGradient id="customizerSideOneTop" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor={sideOneTop.from} />
            <stop offset="55%" stopColor={sideOneTop.mid} />
            <stop offset="100%" stopColor={sideOneTop.to} />
          </radialGradient>
          <radialGradient id="customizerSideTwoTop" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor={sideTwoTop.from} />
            <stop offset="55%" stopColor={sideTwoTop.mid} />
            <stop offset="100%" stopColor={sideTwoTop.to} />
          </radialGradient>
          <radialGradient id="customizerSideOneBottom" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor={sideOneBottom.from} />
            <stop offset="55%" stopColor={sideOneBottom.mid} />
            <stop offset="100%" stopColor={sideOneBottom.to} />
          </radialGradient>
          <radialGradient id="customizerSideTwoBottom" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor={sideTwoBottom.from} />
            <stop offset="55%" stopColor={sideTwoBottom.mid} />
            <stop offset="100%" stopColor={sideTwoBottom.to} />
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

        {/* Top band: side one (left) / side two (right), split by a dashed divider */}
        <line x1="210" y1="104" x2="210" y2="148" stroke={band.stroke} strokeWidth="1" strokeDasharray="2 4" opacity="0.4" />
        {[80, 126].map(cx => (
          <g key={`top-one-${cx}`}>
            <circle cx={cx} cy="126" r="15" fill="url(#customizerSideOneTop)" />
            <circle cx={cx} cy="126" r="15" fill="none" stroke={band.stroke} strokeWidth="1" opacity="0.3" />
            <circle cx={cx - 8} cy="119" r="3.4" fill="#FFFFFF" opacity="0.9" />
          </g>
        ))}
        {[294, 340].map(cx => (
          <g key={`top-two-${cx}`}>
            <circle cx={cx} cy="126" r="15" fill="url(#customizerSideTwoTop)" />
            <circle cx={cx} cy="126" r="15" fill="none" stroke={band.stroke} strokeWidth="1" opacity="0.3" />
            <circle cx={cx - 8} cy="119" r="3.4" fill="#FFFFFF" opacity="0.9" />
          </g>
        ))}

        {/* Bottom band: side one (left) / side two (right), split by a dashed divider */}
        <line x1="210" y1="232" x2="210" y2="276" stroke={band.stroke} strokeWidth="1" strokeDasharray="2 4" opacity="0.4" />
        {[80, 126].map(cx => (
          <g key={`bottom-one-${cx}`}>
            <circle cx={cx} cy="254" r="15" fill="url(#customizerSideOneBottom)" />
            <circle cx={cx} cy="254" r="15" fill="none" stroke={band.stroke} strokeWidth="1" opacity="0.3" />
            <circle cx={cx - 8} cy="247" r="3.4" fill="#FFFFFF" opacity="0.75" />
          </g>
        ))}
        {[294, 340].map(cx => (
          <g key={`bottom-two-${cx}`}>
            <circle cx={cx} cy="254" r="15" fill="url(#customizerSideTwoBottom)" />
            <circle cx={cx} cy="254" r="15" fill="none" stroke={band.stroke} strokeWidth="1" opacity="0.3" />
            <circle cx={cx - 8} cy="247" r="3.4" fill="#FFFFFF" opacity="0.75" />
          </g>
        ))}
      </svg>

      <div className={styles.zoneCaptions}>
        <Text as="span" size="b3" className={styles.zoneCaption} text={`Side One — Top ${sideOneTopStone} · Bottom ${sideOneBottomStone}`} />
        <Text as="span" size="b3" className={styles.zoneCaption} text={`Side Two — Top ${sideTwoTopStone} · Bottom ${sideTwoBottomStone}`} />
      </div>
    </div>
  );
};

export default SubwayRingImage;
