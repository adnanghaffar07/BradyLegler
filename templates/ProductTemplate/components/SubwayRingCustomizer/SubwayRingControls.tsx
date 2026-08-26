'use client';

import React, { useMemo } from 'react';
import Text from '@/components/Text';
import formatCurrency from '@/helpers/formatCurrency';
import { Metal, Stone, METALS, STONES, BASE_PRICE, METAL_PRICE_MODIFIER, STONE_PRICE_MODIFIER } from './constants';
import styles from './SubwayRingControls.module.scss';

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
  const price = useMemo(
    () => BASE_PRICE + METAL_PRICE_MODIFIER[metal] + STONE_PRICE_MODIFIER[topStone] + STONE_PRICE_MODIFIER[bottomStone],
    [metal, topStone, bottomStone]
  );

  return (
    <div className={styles.controls}>
      <Text as="span" size="b3" className={styles.heading} text="Customize this piece" />

      <div className={styles.priceRow}>
        <Text as="span" size="h2" className={styles.price} text={formatCurrency({ amount: price, currencyCode })} />
        <Text as="span" size="b3" className={styles.priceNote} text="Price updates with your selections" />
      </div>

      <div className={styles.selectGroup}>
        <label htmlFor="customizer-metal" className={styles.selectLabel}>
          Metal
        </label>
        <select
          id="customizer-metal"
          className={styles.select}
          value={metal}
          onChange={e => onMetalChange(e.target.value as Metal)}
        >
          {METALS.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.selectGroup}>
        <label htmlFor="customizer-top-stone" className={styles.selectLabel}>
          Top band stone
        </label>
        <select
          id="customizer-top-stone"
          className={styles.select}
          value={topStone}
          onChange={e => onTopStoneChange(e.target.value as Stone)}
        >
          {STONES.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.selectGroup}>
        <label htmlFor="customizer-bottom-stone" className={styles.selectLabel}>
          Bottom band stone
        </label>
        <select
          id="customizer-bottom-stone"
          className={styles.select}
          value={bottomStone}
          onChange={e => onBottomStoneChange(e.target.value as Stone)}
        >
          {STONES.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
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
