'use client';

import React, { useMemo, useState } from 'react';
import Text from '@/components/Text';
import formatCurrency from '@/helpers/formatCurrency';
import classNames from '@/helpers/classNames';
import {
  SideKey,
  Metal,
  Finish,
  SideConfiguration,
  SIDES,
  METALS,
  FINISHES,
  FINISH_SWATCH,
  METAL_GRADIENT,
  BASE_PRICE,
  METAL_PRICE_MODIFIER,
  FINISH_PRICE_MODIFIER,
  describeFinish
} from './constants';
import styles from './SubwayRingControls.module.scss';

type SubwayRingControlsProps = {
  currencyCode?: string;
  activeSide: SideKey;
  sideOne: SideConfiguration;
  sideTwo: SideConfiguration;
  onActiveSideChange: (side: SideKey) => void;
  onSideChange: (side: SideKey, configuration: SideConfiguration) => void;
  /** Metal is one choice for the whole ring, so it applies to both sides at once. */
  onMetalChange: (metal: Metal) => void;
};

// The metal chips carry the real metal gradient, so metal reads visually the same
// way the stone and enamel swatches do.
const metalSwatchStyle = (metal: Metal) => {
  const { from, mid, to } = METAL_GRADIENT[metal];
  return { backgroundImage: `linear-gradient(135deg, ${from} 0%, ${mid} 55%, ${to} 100%)` };
};

const SubwayRingControls: React.FC<SubwayRingControlsProps> = ({
  currencyCode = 'USD',
  activeSide,
  sideOne,
  sideTwo,
  onActiveSideChange,
  onSideChange,
  onMetalChange
}) => {
  const current = activeSide === 'sideOne' ? sideOne : sideTwo;
  const [finishOpen, setFinishOpen] = useState(false);

  const price = useMemo(
    () =>
      BASE_PRICE +
      // One metal for the whole ring, so the metal uplift is charged once - not per side.
      METAL_PRICE_MODIFIER[sideOne.metal] +
      FINISH_PRICE_MODIFIER[sideOne.finish] +
      FINISH_PRICE_MODIFIER[sideTwo.finish],
    [sideOne, sideTwo]
  );
  const setFinish = (finish: Finish) => onSideChange(activeSide, { ...current, finish });

  const summary: { key: SideKey; label: string; side: SideConfiguration }[] = [
    { key: 'sideOne', label: 'Side One', side: sideOne },
    { key: 'sideTwo', label: 'Side Two', side: sideTwo }
  ];

  return (
    <div className={styles.controls}>
      {/* Side One / Side Two tabs - each side is configured independently. */}
      <div className={styles.tabs} role="tablist" aria-label="Ring side">
        {SIDES.map(side => (
          <button
            key={side.key}
            type="button"
            role="tab"
            id={`subway-tab-${side.key}`}
            aria-selected={activeSide === side.key}
            aria-controls="subway-side-panel"
            className={classNames(styles.tab, { [styles.tabActive]: activeSide === side.key })}
            onClick={() => onActiveSideChange(side.key)}
          >
            {side.label}
          </button>
        ))}
      </div>

      <div
        className={styles.panel}
        role="tabpanel"
        id="subway-side-panel"
        aria-labelledby={`subway-tab-${activeSide}`}
      >
        <div className={styles.metalGroup}>
          <Text as="span" className={styles.sectionLabel} text="Metal" />
          <div className={styles.metalOptions}>
            {METALS.map(option => (
              <button
                key={option}
                type="button"
                aria-pressed={option === current.metal}
                className={classNames(styles.metalChip, { [styles.metalChipSelected]: option === current.metal })}
                onClick={() => onMetalChange(option)}
              >
                <span className={styles.metalDot} style={metalSwatchStyle(option)} />
                <span className={styles.metalLabel}>{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* One stone or enamel per side - it runs across both of that side's bands. */}
        <div className={styles.bands}>
          <div className={classNames(styles.bandGroup, { [styles.bandGroupOpen]: finishOpen })}>
            <button
              type="button"
              className={styles.bandHeader}
              onClick={() => setFinishOpen(open => !open)}
              aria-expanded={finishOpen}
              aria-controls={`subway-finish-${activeSide}`}
            >
              <span className={styles.bandLabel}>Stone or Enamel</span>
              <span className={styles.bandCurrent}>
                <span
                  className={classNames(styles.dot, {
                    [styles.dotEmpty]: current.finish === 'No Enamel or Stone'
                  })}
                  style={{ backgroundColor: FINISH_SWATCH[current.finish] }}
                />
                <span className={styles.bandValue}>{describeFinish(current.finish)}</span>
              </span>
              <svg
                width="11"
                height="11"
                viewBox="0 0 12 12"
                className={classNames(styles.bandIcon, { [styles.bandIconExpanded]: finishOpen })}
                aria-hidden="true"
              >
                <line x1="6" y1="0.5" x2="6" y2="11.5" stroke="currentColor" strokeWidth="1.1" />
                <line x1="0.5" y1="6" x2="11.5" y2="6" stroke="currentColor" strokeWidth="1.1" />
              </svg>
            </button>

            {finishOpen && (
              <div className={styles.finishGrid} id={`subway-finish-${activeSide}`}>
                {FINISHES.map(option => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={option === current.finish}
                    className={classNames(styles.finishButton, {
                      [styles.finishSelected]: option === current.finish
                    })}
                    onClick={() => setFinish(option)}
                  >
                    <span
                      className={classNames(styles.dot, {
                        [styles.dotEmpty]: option === 'No Enamel or Stone'
                      })}
                      style={{ backgroundColor: FINISH_SWATCH[option] }}
                    />
                    <span className={styles.finishLabel}>{option}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Final product display - the customer's exact configuration. */}
      <div className={styles.summary}>
        <Text as="span" className={styles.sectionLabel} text="Your Configuration" />
        {summary.map(entry => (
          <div key={entry.key} className={styles.summaryRow}>
            <Text as="span" className={styles.summarySide} text={entry.label} />
            <Text
              as="span"
              className={styles.summaryDetail}
              text={`${entry.side.metal} · ${describeFinish(entry.side.finish)}`}
            />
          </div>
        ))}
      </div>

      <Text as="span" className={styles.caption} text="Pricing and imagery shown are illustrative." />

      {/* Price sits last, directly above the size selector and purchase button. */}
      <div className={styles.priceRow}>
        <Text as="span" className={styles.price} text={formatCurrency({ amount: price, currencyCode })} />
        <Text as="span" className={styles.caption} text="Price updates with your selections" />
      </div>
    </div>
  );
};

export default SubwayRingControls;
