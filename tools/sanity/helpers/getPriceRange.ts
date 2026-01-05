const DEFAULT_CURRENCY_CODE = 'USD';

type PriceObject = {
  minVariantPrice?: number | { _type?: string; amount: number | string; currencyCode?: string };
  maxVariantPrice?: number | { _type?: string; amount: number | string; currencyCode?: string } | null;
};

// Extract numeric value from any format
const extractPrice = (price: any): number => {
  if (price === null || price === undefined) {
    return 0;
  }

  // Case 1: Already a number (old format - in cents)
  if (typeof price === 'number') {
    return price;
  }

  // Case 2: Object with amount property (new format)
  if (typeof price === 'object' && price.amount !== undefined) {
    const amount = price.amount;

    // Handle string or number amount
    if (typeof amount === 'string') {
      const num = parseFloat(amount);

      // Check if it's in dollars (0.0) or cents (2000)
      if (num < 100 && Math.abs(num - Math.floor(num)) > 0) {
        // Looks like dollars (0.0, 20.99) - convert to cents
        return Math.round(num * 100);
      }
      // Otherwise assume it's already in cents or handle NaN
      return isNaN(num) ? 0 : num;
    }

    if (typeof amount === 'number') {
      // Check if it's dollars or cents
      if (amount < 100 && amount % 1 !== 0) {
        // Looks like dollars (0.0, 20.99) - convert to cents
        return Math.round(amount * 100);
      }
      // Assume it's cents
      return amount;
    }
  }

  // Case 3: String that can be parsed
  if (typeof price === 'string') {
    const num = parseFloat(price);
    return isNaN(num) ? 0 : num;
  }

  return 0;
};

const formatPrice = (cents: number) => {
  // Convert cents to dollars
  const dollars = cents / 1;

  return new Intl.NumberFormat('en', {
    currency: DEFAULT_CURRENCY_CODE,
    style: 'currency',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(dollars);
};

export const getPriceRange = (price: PriceObject) => {
  if (!price || (price.minVariantPrice === undefined && price.maxVariantPrice === undefined)) {
    return '0.00';
  }

  // Extract prices from whatever format they're in
  const minPrice = extractPrice(price.minVariantPrice);
  const maxPrice = price.maxVariantPrice ? extractPrice(price.maxVariantPrice) : minPrice;

  // If both are 0, show no price
  if (minPrice === 0 && maxPrice === 0) {
    return '0.00';
  }

  if (maxPrice && minPrice !== maxPrice) {
    return `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`;
  }

  return formatPrice(minPrice);
};
