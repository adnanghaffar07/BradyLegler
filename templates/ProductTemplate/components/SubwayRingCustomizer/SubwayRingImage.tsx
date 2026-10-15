'use client';

import React, { useEffect, useId } from 'react';
import Text from '@/components/Text';
import classNames from '@/helpers/classNames';
import {
  SideKey,
  SideConfiguration,
  METAL_GRADIENT,
  FINISH_GRADIENT,
  FINISH_KIND,
  getSideImage,
  getAllSideImages,
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

// The illustration is the fallback for finishes we have no photo of, so it has to
// sit at the same scale as the photography or switching to (say) Platinum makes the
// ring jump in size. Measured across all 24 client shots, the ring occupies 37.3%
// of the frame width, so the drawing is placed in a square frame sized to match and
// centred within it.
const DRAWING_WIDTH = 420;
const DRAWING_HEIGHT = 190;
const RING_FRAME_RATIO = 0.373;
const FRAME = Math.round(BAND_WIDTH / RING_FRAME_RATIO); // ~992
const OFFSET_X = Math.round((FRAME - DRAWING_WIDTH) / 2);
const OFFSET_Y = Math.round((FRAME - DRAWING_HEIGHT) / 2);
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
  const finishId = `${idPrefix}-finish`;
  const kind = FINISH_KIND[side.finish];

  const renderBand = (y: number, keyPrefix: string) => {
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
      viewBox={`0 0 ${FRAME} ${FRAME}`}
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
        <radialGradient id={finishId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={FINISH_GRADIENT[side.finish].from} />
          <stop offset="55%" stopColor={FINISH_GRADIENT[side.finish].mid} />
          <stop offset="100%" stopColor={FINISH_GRADIENT[side.finish].to} />
        </radialGradient>
        <filter id={shadowId} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="8" stdDeviation="11" floodColor="#000000" floodOpacity="0.15" />
        </filter>
      </defs>

      <g transform={`translate(${OFFSET_X}, ${OFFSET_Y})`}>
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
        {renderBand(TOP_BAND_Y, 'top')}
        {renderBand(BOTTOM_BAND_Y, 'bottom')}
      </g>
      </g>
    </svg>
  );
};

const SubwayRingImage: React.FC<SubwayRingImageProps> = ({ activeSide, sideOne, sideTwo }) => {
  // Warm the browser cache with every photo once the page is idle. Without this the
  // first selection of each finish waits on a network round trip, which reads as the
  // configurator lagging behind the click. The full set is ~1MB and this runs after
  // mount, so it never competes with the initial render.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;
    const preload = () => {
      if (cancelled) return;
      getAllSideImages().forEach(src => {
        const img = new window.Image();
        img.decoding = 'async';
        img.src = src;
      });
    };

    const idle = (window as any).requestIdleCallback as undefined | ((cb: () => void) => number);
    const handle = idle ? idle(preload) : window.setTimeout(preload, 600);

    return () => {
      cancelled = true;
      const cancelIdle = (window as any).cancelIdleCallback as undefined | ((id: number) => void);
      if (idle && cancelIdle) cancelIdle(handle as number);
      else window.clearTimeout(handle as number);
    };
  }, []);

  // SVG gradient ids are document-global, so scope them per instance.
  const uid = useId().replace(/:/g, '');

  const views: { key: SideKey; label: string; side: SideConfiguration }[] = [
    { key: 'sideOne', label: 'Side One', side: sideOne },
    { key: 'sideTwo', label: 'Side Two', side: sideTwo }
  ];

  return (
    <div className={styles.imagePanel}>
      {/* Both faces of the ring, so the customer sees the full flip. Each side shows
          client photography where we have it, and the generated illustration where
          we do not - so a part-photographed range still renders cleanly. */}
      {views.map(view => {
        const photo = getSideImage(view.side);
        const isActive = activeSide === view.key;

        return (
          <div
            key={view.key}
            className={classNames(styles.sideView, { [styles.sideViewActive]: isActive })}
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                decoding="async"
                alt={`${view.label} - ${describeSide(view.side)}`}
                className={styles.photo}
                style={{ opacity: isActive ? 1 : 0.78, transition: 'opacity 0.25s ease' }}
              />
            ) : (
              <SideBands side={view.side} idPrefix={`${uid}-${view.key}`} dimmed={!isActive} />
            )}
            <Text
              as="span"
              className={classNames(styles.zoneCaption, { [styles.zoneCaptionActive]: isActive })}
              text={`${view.label} - ${describeSide(view.side)}`}
            />
          </div>
        );
      })}
    </div>
  );
};

export default SubwayRingImage;
