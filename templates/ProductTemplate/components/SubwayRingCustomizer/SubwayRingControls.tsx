'use client';

import React, { useMemo, useState } from 'react';
import Text from '@/components/Text';
import formatCurrency from '@/helpers/formatCurrency';
import classNames from '@/helpers/classNames';
import { Metal, Stone, METALS, STONES, BASE_PRICE, METAL_PRICE_MODIFIER, STONE_PRICE_MODIFIER } from './constants';
import styles from './SubwayRingControls.module.scss';

type RowKey = 'metal' | 'sideOneTop' | 'sideOneBottom' | 'sideTwoTop' | 'sideTwoBottom';

type SubwayRingControlsProps = {
  currencyCode?: string;
  metal: Metal;
  sideOneTopStone: Stone;
  sideTwoTopStone: Stone;
  sideOneBottomStone: Stone;
  sideTwoBottomStone: Stone;
  onMetalChange: (metal: Metal) => void;
  onSideOneTopChange: (stone: Stone) => void;
  onSideTwoTopChange: (stone: Stone) => void;
  onSideOneBottomChange: (stone: Stone) => void;
  onSideTwoBottomChange: (stone: Stone) => void;
};

const SubwayRingControls: React.FC<SubwayRingControlsProps> = ({
  currencyCode = 'USD',
  metal,
  sideOneTopStone,
  sideTwoTopStone,
  sideOneBottomStone,
  sideTwoBottomStone,
  onMetalChange,
  onSideOneTopChange,
  onSideTwoTopChange,
  onSideOneBottomChange,
  onSideTwoBottomChange
}) => {
  const [expandedRow, setExpandedRow] = useState<RowKey | null>(null);

  const price = useMemo(
    () =>
      BASE_PRICE +
      METAL_PRICE_MODIFIER[metal] +
      STONE_PRICE_MODIFIER[sideOneTopStone] +
      STONE_PRICE_MODIFIER[sideTwoTopStone] +
      STONE_PRICE_MODIFIER[sideOneBottomStone] +
      STONE_PRICE_MODIFIER[sideTwoBottomStone],
    [metal, sideOneTopStone, sideTwoTopStone, sideOneBottomStone, sideTwoBottomStone]
  );

  const toggleRow = (key: RowKey) => {
    setExpandedRow(prev => (prev === key ? null : key));
  };

  const rows: {
    key: RowKey;
    label: string;
    value: string;
    options: string[];
    onSelect: (value: string) => void;
  }[] = [
    { key: 'metal', label: 'Metal', value: metal, options: METALS, onSelect: v => onMetalChange(v as Metal) },
    {
      key: 'sideOneTop',
      label: 'Side One – Top stone',
      value: sideOneTopStone,
      options: STONES,
      onSelect: v => onSideOneTopChange(v as Stone)
    },
    {
      key: 'sideOneBottom',
      label: 'Side One – Bottom stone',
      value: sideOneBottomStone,
      options: STONES,
      onSelect: v => onSideOneBottomChange(v as Stone)
    },
    {
      key: 'sideTwoTop',
      label: 'Side Two – Top stone',
      value: sideTwoTopStone,
      options: STONES,
      onSelect: v => onSideTwoTopChange(v as Stone)
    },
    {
      key: 'sideTwoBottom',
      label: 'Side Two – Bottom stone',
      value: sideTwoBottomStone,
      options: STONES,
      onSelect: v => onSideTwoBottomChange(v as Stone)
    }
  ];

  return (
    <div className={styles.controls}>
      <Text as="span" size="b3" className={styles.heading} text="Customize this piece" />

      <div className={styles.priceRow}>
        <Text as="span" size="h2" className={styles.price} text={formatCurrency({ amount: price, currencyCode })} />
        <Text as="span" size="b3" className={styles.priceNote} text="Price updates with your selections" />
      </div>

      <div className={styles.rows}>
        {rows.map(row => {
          const isExpanded = expandedRow === row.key;
          return (
            <div key={row.key} className={styles.row}>
              <button
                type="button"
                className={styles.rowHeader}
                onClick={() => toggleRow(row.key)}
                aria-expanded={isExpanded}
              >
                <span className={styles.rowLabel}>{row.label}</span>
                <span className={styles.rowValueGroup}>
                  <span className={styles.rowValue}>{row.value}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    className={classNames(styles.rowIcon, { [styles.rowIconExpanded]: isExpanded })}
                  >
                    <line x1="6" y1="0.5" x2="6" y2="11.5" stroke="currentColor" strokeWidth="1.1" />
                    <line x1="0.5" y1="6" x2="11.5" y2="6" stroke="currentColor" strokeWidth="1.1" />
                  </svg>
                </span>
              </button>

              {isExpanded && (
                <div className={styles.optionsRow}>
                  {row.options.map(option => (
                    <button
                      key={option}
                      type="button"
                      className={classNames(styles.optionButton, { [styles.optionSelected]: option === row.value })}
                      onClick={() => row.onSelect(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Text
        as="span"
        size="b3"
        className={styles.disclaimer}
        text="Pricing and imagery shown are illustrative."
      />
    </div>
  );
};

export default SubwayRingControls;
