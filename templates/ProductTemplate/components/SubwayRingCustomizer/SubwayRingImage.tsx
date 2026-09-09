'use client';

import React, { useId } from 'react';
import Text from '@/components/Text';
import classNames from '@/helpers/classNames';
import {
  SideKey,
  Finish,
  SideConfiguration,
  RingConfiguration,
  METAL_GRADIENT,
  FINISH_GRADIENT,
  FINISH_KIND,
  getRingImageAsset,
  buildConfigKey,
  describeSide
} from './constants';
import styles from './SubwayRingImage.module.scss';

type SubwayRingImageProps = {
  activeSide: SideKey;
  sideOne: SideConfiguration;
  sideTwo: SideConfiguration;
};

// One side of the ring, drawn face-on as a double band (top + bottom).
const BAND_X = 25;
const BAND_WIDTH = 370;
const BAND_HEIGHT = 58;
const TOP_BAND_Y = 22;
const BOTTOM_BAND_Y = 110;
const STONE_POSITIONS = [82, 133, 184, 236, 287, 338];

type SideBandsProps = {
  side: SideConfiguration;
  idPrefix: string;
  dimmed: boolean;
};

const SideBands: React.FC<SideBandsProps> = ({ side, idPrefix, dimmed }) => {
  const band = METAL_GRADIENT[side.metal];

  const bandId = `${idPrefix}-band`;
  const shadowId = `${idPrefix}-shadow`;
  const finishIdFor = (keyPrefix: string) => `${idPrefix}-${keyPrefix}-finish`;

  const renderBand = (y: number, keyPrefix: string, bandFinish: Finish) => {
    const kind = FINISH_KIND[bandFinish];
    const finishId = finishIdFor(keyPrefix);

    return (
    <g key={keyPrefix}>
      <rect x={BAND_X} y={y} width={BAND_WIDTH} height={BAND_HEIGHT} rx={BAND_HEIGHT / 2} fill={`url(#${bandId})`} />
      <rect
        x={BAND_X}
        y={y}
        width={BAND_WIDTH}
        height={BAND_HEIGHT}
        rx={BAND_HEIGHT / 2}
        fill="none"
        stroke={band.stroke}
        strokeWidth="1"
        opacity="0.4"
      />

      {kind === 'none' && (
        <line
          x1={BAND_X + 40}
          y1={y + BAND_HEIGHT / 2}
          x2={BAND_X + BAND_WIDTH - 40}
          y2={y + BAND_HEIGHT / 2}
          stroke={band.stroke}
          strokeWidth="1"
          opacity="0.25"
        />
      )}

      {kind === 'enamel' && (
        <>
          <rect x={BAND_X + 35} y={y + 15} width={BAND_WIDTH - 70} height={28} rx={14} fill={`url(#${finishId})`} />
          <rect
            x={BAND_X + 35}
            y={y + 15}
            width={BAND_WIDTH - 70}
            height={28}
            rx={14}
            fill="none"
            stroke={band.stroke}
            strokeWidth="1"
            opacity="0.35"
          />
        </>
      )}

      {kind === 'stone' &&
        STONE_POSITIONS.map(cx => (
          <g key={`${keyPrefix}-stone-${cx}`}>
            <circle cx={cx} cy={y + BAND_HEIGHT / 2} r="15" fill={`url(#${finishId})`} />
            <circle
              cx={cx}
              cy={y + BAND_HEIGHT / 2}
              r="15"
              fill="none"
              stroke={band.stroke}
              strokeWidth="1"
              opacity="0.3"
            />
            <circle cx={cx - 8} cy={y + BAND_HEIGHT / 2 - 7} r="3.4" fill="#FFFFFF" opacity="0.85" />
          </g>
        ))}
      </g>
    );
  };

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 420 190"
      className={styles.bands}
      style={{ opacity: dimmed ? 0.78 : 1, transition: 'opacity 0.25s ease' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={bandId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={band.from} />
          <stop offset="45%" stopColor={band.mid} />
          <stop offset="100%" stopColor={band.to} />
        </linearGradient>
        {(['top', 'bottom'] as const).map(bandKey => {
          const finish = FINISH_GRADIENT[side[bandKey]];
          return (
            <radialGradient key={bandKey} id={finishIdFor(bandKey)} cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor={finish.from} />
              <stop offset="55%" stopColor={finish.mid} />
              <stop offset="100%" stopColor={finish.to} />
            </radialGradient>
          );
        })}
        <filter id={shadowId} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="8" stdDeviation="11" floodColor="#000000" floodOpacity="0.15" />
        </filter>
      </defs>

      <g filter={`url(#${shadowId})`}>
        {/* Bridge joining the two bands, drawn first so the bands sit over it. */}
        <rect x="190" y={TOP_BAND_Y + BAND_HEIGHT - 6} width="40" height={BOTTOM_BAND_Y - TOP_BAND_Y - BAND_HEIGHT + 12} rx="5" fill={band.mid} />
        <rect
          x="190"
          y={TOP_BAND_Y + BAND_HEIGHT - 6}
          width="40"
          height={BOTTOM_BAND_Y - TOP_BAND_Y - BAND_HEIGHT + 12}
          rx="5"
          fill="none"
          stroke={band.stroke}
          strokeWidth="1"
          opacity="0.4"
        />
        {renderBand(TOP_BAND_Y, 'top', side.top)}
        {renderBand(BOTTOM_BAND_Y, 'bottom', side.bottom)}
      </g>
    </svg>
  );
};

const SubwayRingImage: React.FC<SubwayRingImageProps> = ({ activeSide, sideOne, sideTwo }) => {
  // SVG gradient ids are document-global, so scope them per instance.
  const uid = useId().replace(/:/g, '');
  const configuration: RingConfiguration = { sideOne, sideTwo };
  const assetUrl = getRingImageAsset(configuration);

  const altText = `Subway ring - Side One ${describeSide(sideOne)}; Side Two ${describeSide(sideTwo)}`;

  const views: { key: SideKey; label: string; side: SideConfiguration }[] = [
    { key: 'sideOne', label: 'Side One', side: sideOne },
    { key: 'sideTwo', label: 'Side Two', side: sideTwo }
  ];

  if (assetUrl) {
    return (
      <div className={styles.imagePanel}>
        {/* Client-supplied photography for this exact configuration. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={buildConfigKey(configuration)} src={assetUrl} alt={altText} className={styles.photo} />
        <div className={styles.zoneCaptions}>
          {views.map(view => (
            <Text
              key={view.key}
              as="span"
              className={classNames(styles.zoneCaption, {
                [styles.zoneCaptionActive]: activeSide === view.key
              })}
              text={`${view.label} - ${describeSide(view.side)}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.imagePanel}>
      {/* Both faces of the ring, so the customer sees the full flip. */}
      {views.map(view => (
        <div
          key={view.key}
          className={classNames(styles.sideView, { [styles.sideViewActive]: activeSide === view.key })}
        >
          <SideBands side={view.side} idPrefix={`${uid}-${view.key}`} dimmed={activeSide !== view.key} />
          <Text
            as="span"
            className={classNames(styles.zoneCaption, { [styles.zoneCaptionActive]: activeSide === view.key })}
            text={`${view.label} - ${describeSide(view.side)}`}
          />
        </div>
      ))}
    </div>
  );
};

export default SubwayRingImage;
