import React from 'react';
import Text from '@/components/Text';
import styles from './styles.module.scss';
import formatCurrency from '@/helpers/formatCurrency';

type PriceProps = {
  price: string;
  compareAtPrice?: string;
};

const Price: React.FC<PriceProps> = props => {
  const { price, compareAtPrice } = props;

  // Debug what's coming in
  console.log('Price component received:', { price, compareAtPrice });

  // Convert empty strings or invalid values
  const priceValue = price && price !== '0' ? price : '0';
  const compareAtPriceValue = compareAtPrice && compareAtPrice !== '0' ? compareAtPrice : undefined;

  // Format the currency
  const priceFormatted = formatCurrency({ amount: priceValue });
  const compareAtPriceFormatted = compareAtPriceValue ? formatCurrency({ amount: compareAtPriceValue }) : null;

  return (
    <div className={styles.price}>
      {compareAtPriceFormatted && (
        <Text as="span" size="b2" className={styles.compareAtPrice} text={compareAtPriceFormatted} />
      )}
      <Text as="span" size="b2" className={styles.price} text={priceFormatted} />
    </div>
  );
};

export default Price;
