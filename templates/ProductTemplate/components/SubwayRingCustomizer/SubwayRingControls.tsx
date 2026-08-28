'use client';

import React, { useMemo, useState } from 'react';
import Text from '@/components/Text';
import formatCurrency from '@/helpers/formatCurrency';
import classNames from '@/helpers/classNames';
import { Metal, Stone, METALS, STONES, BASE_PRICE, METAL_PRICE_MODIFIER, STONE_PRICE_MODIFIER } from './constants';
import styles from './SubwayRingControls.module.scss';

type RowKey = 'metal' | 'topStone' | 'bottomStone';

type SubwayRingControlsProps = {
  currencyCode?: string;
  metal: Metal;
  topStone: Stone;
  bottomStone: Stone;
  onMetalChange: (metal: Metal) => void;
  onTopStoneChange: (stone: Stone) => void;
  onBottomStoneChange: (stone: Stone) => void;
};

const SubwayRingControls: React.FC<SubwayRingControlsProps> = ({
  currencyCode = 'USD',
  metal,
  topStone,
  bottomStone,
  onMetalChange,
  onTopStoneChange,
  onBottomStoneChange
}) => {
  const [expandedRow, setExpandedRow] = useState<RowKey | null>(null);

  const price = useMemo(
    () => BASE_PRICE + METAL_PRICE_MODIFIER[metal] + STONE_PRICE_MODIFIER[topStone] + STONE_PRICE_MODIFIER[bottomStone],
    [metal, topStone, bottomStone]
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
      key: 'topStone',
      label: 'Side One stone',
      value: topStone,
      options: STONES,
      onSelect: v => onTopStoneChange(v as Stone)
    },
    {
      key: 'bottomStone',
      label: 'Side Two stone',
      value: bottomStone,
      options: STONES,
      onSelect: v => onBottomStoneChange(v as Stone)
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
