'use client';

import React, { useMemo, useState } from 'react';
import Text from '@/components/Text';
import formatCurrency from '@/helpers/formatCurrency';
import classNames from '@/helpers/classNames';
import {
  SideKey,
  Metal,
  Finish,
  BandKey,
  SideConfiguration,
  SIDES,
  BANDS,
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
  onSideChange
}) => {
  const current = activeSide === 'sideOne' ? sideOne : sideTwo;
  const [expandedBand, setExpandedBand] = useState<BandKey | null>(null);

  const toggleBand = (band: BandKey) => setExpandedBand(prev => (prev === band ? null : band));

  const price = useMemo(
    () =>
      BASE_PRICE +
      METAL_PRICE_MODIFIER[sideOne.metal] +
      METAL_PRICE_MODIFIER[sideTwo.metal] +
      FINISH_PRICE_MODIFIER[sideOne.top] +
      FINISH_PRICE_MODIFIER[sideOne.bottom] +
      FINISH_PRICE_MODIFIER[sideTwo.top] +
      FINISH_PRICE_MODIFIER[sideTwo.bottom],
    [sideOne, sideTwo]
  );

  const setMetal = (metal: Metal) => onSideChange(activeSide, { ...current, metal });
  const setBandFinish = (band: BandKey, finish: Finish) =>
    onSideChange(activeSide, { ...current, [band]: finish });

  const summary: { key: SideKey; label: string; side: SideConfiguration }[] = [
    { key: 'sideOne', label: 'Side One', side: sideOne },
    { key: 'sideTwo', label: 'Side Two', side: sideTwo }
  ];

  return (
    <div className={styles.controls}>
      <header className={styles.header}>
        <Text as="span" className={styles.eyebrow} text="Customize this piece" />
        <Text as="p" className={styles.intro} text="Two rings in one — flip the ring for a different look." />
      </header>

      <div className={styles.priceRow}>
        <Text as="span" className={styles.price} text={formatCurrency({ amount: price, currencyCode })} />
        <Text as="span" className={styles.caption} text="Price updates with your selections" />
      </div>

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
                onClick={() => setMetal(option)}
              >
                <span className={styles.metalDot} style={metalSwatchStyle(option)} />
                <span className={styles.metalLabel}>{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Each band is configured independently, revealed on tap. */}
        <div className={styles.bands}>
          {BANDS.map(band => {
            const isExpanded = expandedBand === band.key;
            const selected = current[band.key];
            return (
              <div key={band.key} className={classNames(styles.bandGroup, { [styles.bandGroupOpen]: isExpanded })}>
                <button
                  type="button"
                  className={styles.bandHeader}
                  onClick={() => toggleBand(band.key)}
                  aria-expanded={isExpanded}
                  aria-controls={`subway-band-${activeSide}-${band.key}`}
                >
                  <span className={styles.bandLabel}>{band.label}</span>
                  <span className={styles.bandCurrent}>
                    <span
                      className={classNames(styles.dot, {
                        [styles.dotEmpty]: selected === 'No Enamel or Stone'
                      })}
                      style={{ backgroundColor: FINISH_SWATCH[selected] }}
                    />
                    <span className={styles.bandValue}>{describeFinish(selected)}</span>
                  </span>
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 12 12"
                    className={classNames(styles.bandIcon, { [styles.bandIconExpanded]: isExpanded })}
                    aria-hidden="true"
                  >
                    <line x1="6" y1="0.5" x2="6" y2="11.5" stroke="currentColor" strokeWidth="1.1" />
                    <line x1="0.5" y1="6" x2="11.5" y2="6" stroke="currentColor" strokeWidth="1.1" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className={styles.finishGrid} id={`subway-band-${activeSide}-${band.key}`}>
                    {FINISHES.map(option => (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={option === selected}
                        className={classNames(styles.finishButton, { [styles.finishSelected]: option === selected })}
                        onClick={() => setBandFinish(band.key, option)}
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
            );
          })}
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
              text={`${entry.side.metal} · Top ${describeFinish(entry.side.top)} · Bottom ${describeFinish(
                entry.side.bottom
              )}`}
            />
          </div>
        ))}
      </div>

      <Text as="span" className={styles.caption} text="Pricing and imagery shown are illustrative." />
    </div>
  );
};

export default SubwayRingControls;
