import React from 'react';
import Text from '@/components/Text';
import styles from './styles.module.scss';
import formatCurrency from '@/helpers/formatCurrency';

type PriceProps = {
  price: string;
  compareAtPrice?: string;
  inquiryEnabled?: boolean;
};

const Price: React.FC<PriceProps> = props => {
  const { price, compareAtPrice, inquiryEnabled } = props;

  // If inquiry is enabled, show custom message
  if (inquiryEnabled) {
    return (
      <div className={styles.price}>
        <Text as="span" size="b2" className={styles.price} text="Price Available on Request" />
      </div>
    );
  }

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
