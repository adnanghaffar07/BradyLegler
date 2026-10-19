'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AddToCartButton from '../AddToCartButton';
import InquireButton from '../InquireButton';
import Text from '@/components/Text';
import RingSizeDrawer from '@/components/product/RingSizeDrawer';
import { useCart } from '@/tools/store/useCart';
import { useAnalytics } from '@/tools/analytics';
import { trackAddToCart as metaTrackAddToCart } from '@/lib/meta';
import { getSelectableOptions, hasMeaningfulVariantChoices } from '@/lib/productOptions';
import { getVariantRingSize, isValidRingSize } from '@/lib/ringSizes';
import { IProductDocument } from '@/tools/sanity/schema/documents/product';
import styles from './styles.module.scss';
import Price from '../Price';
import classNames from 'classnames';

type VariantType = {
  gid: string;
  title: string;
  price?: string;
  compareAtPrice?: string;
  inventory: { isAvailable: boolean };
  option1?: string;
  option2?: string;
  option3?: string;
};

type FormProps = {
  sanityProductData: IProductDocument;
  setSelectedVariant?: React.Dispatch<React.SetStateAction<VariantType | null>>;
  currencyCode?: string;
  onOpenSizeGuide?: () => void;
  showSizeChartLink?: boolean;
  isRing?: boolean;
  hidePrice?: boolean;
  /**
   * Made-to-order configuration recorded against the cart line, so the shopper and
   * whoever fulfils the order can both see exactly what was built.
   */
  cartLineAttributes?: { key: string; value: string }[];
};

const Form: React.FC<FormProps> = ({
  sanityProductData,
  setSelectedVariant: handleSetSelectVariant,
  currencyCode,
  onOpenSizeGuide,
  showSizeChartLink = false,
  isRing = false,
  hidePrice = false,
  cartLineAttributes
}) => {
  const product = sanityProductData?.store;
  const variants = useMemo(
    () => (product?.variants?.map(({ store }) => store as unknown as VariantType) ?? []) as VariantType[],
    [product]
  );
  const options = product?.options ?? [];
  const hasAvailableVariants = variants.some(variant => variant.inventory.isAvailable);
  const firstAvailableVariant = variants.find(v => v.inventory.isAvailable) ?? null;

  const hasRingSizes = useMemo(() => {
    return variants.some(variant => {
      const size = getVariantRingSize(variant as any, options as any);
      return size ? isValidRingSize(size) : false;
    });
  }, [variants, options]);

  const showAsRing = isRing && hasRingSizes;

  const [selectedVariant, setVariant] = useState<VariantType | null>(showAsRing ? null : firstAvailableVariant);
  const [ringDrawerOpen, setRingDrawerOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    if (isRing || !firstAvailableVariant) return {};

    const { option1, option2, option3 } = firstAvailableVariant;
    const selectedOptionsValues = [option1, option2, option3];

    return options.reduce(
      (acc, option, index) => ({
        ...acc,
        [option.name]: selectedOptionsValues[index]
      }),
      {}
    );
  });

  const setSelectedVariant = useCallback((variant: VariantType | null) => {
    setVariant(variant);
    if (handleSetSelectVariant) {
      handleSetSelectVariant(variant);
    }
  }, []);

  const minVariantPrice = product?.priceRange?.minVariantPrice;
  const ringDisplayPrice = useMemo(() => {
    if (typeof minVariantPrice === 'number') {
      return String(minVariantPrice);
    }

    const firstAvailable = variants.find(variant => variant.inventory.isAvailable);
    return firstAvailable?.price;
  }, [minVariantPrice, variants]);

  const getSelectedOptions = useCallback(
    (variant: VariantType) => {
      const { option1, option2, option3 } = variant;
      const selectedOptionsValues = [option1, option2, option3];
      return options.reduce(
        (acc, option, index) => ({
          ...acc,
          [option.name]: selectedOptionsValues[index]
        }),
        {}
      );
    },
    [options]
  );

  // Set first available variant on mount (non-ring products only)
  useEffect(() => {
    if (showAsRing) {
      setSelectedVariant(null);
      setSelectedOptions({});
      return;
    }

    if (variants.length > 0) {
      const availableVariant = variants.find(v => v.inventory.isAvailable);
      if (availableVariant) {
        setSelectedVariant(availableVariant);
        setSelectedOptions(getSelectedOptions(availableVariant));
      } else {
        setSelectedVariant(null);
        setSelectedOptions({});
      }
    }
  }, [variants, getSelectedOptions, isRing]);

  // Find matching variant based on selected options
  const findMatchingVariant = useCallback(
    (selectedOpts: Record<string, string>) => {
      return variants.find(variant => {
        const variantOptions = getSelectedOptions(variant);
        return Object.entries(selectedOpts).every(
          ([optionName, optionValue]) => variantOptions[optionName] === optionValue
        );
      });
    },
    [variants, getSelectedOptions]
  );

  // Find available variant with specific option value
  const findAvailableVariantWithOption = useCallback(
    (optionName: string, optionValue: string) => {
      return variants.find(variant => {
        const variantOptions = getSelectedOptions(variant);
        return variant.inventory.isAvailable && variantOptions[optionName] === optionValue;
      });
    },
    [variants, getSelectedOptions]
  );

  // Check if an option value is available given current selections
  const isOptionValueAvailable = useCallback(
    (optionName: string, optionValue: string) => {
      const testOptions = { ...selectedOptions, [optionName]: optionValue };
      const possibleVariants = variants.filter(variant => {
        const variantOptions = getSelectedOptions(variant);
        return Object.entries(testOptions).every(([name, value]) => !value || variantOptions[name] === value);
      });
      return possibleVariants.some(variant => variant.inventory.isAvailable);
    },
    [variants, selectedOptions, getSelectedOptions]
  );

  const handleOptionChange = (optionName: string, value: string) => {
    const newOptions = {
      ...selectedOptions,
      [optionName]: value
    };

    const variantWithCurrentSelections = findMatchingVariant(newOptions);

    if (variantWithCurrentSelections?.inventory.isAvailable) {
      setSelectedOptions(newOptions);
      setSelectedVariant(variantWithCurrentSelections);
      setVariant(variantWithCurrentSelections);
    } else {
      const availableVariant = findAvailableVariantWithOption(optionName, value);

      if (availableVariant) {
        const availableOptions = getSelectedOptions(availableVariant);
        setSelectedOptions(availableOptions);
        setSelectedVariant(availableVariant);
      } else {
        setSelectedOptions({ [optionName]: value });
        setSelectedVariant(null);
      }
    }
  };

  const addToCart = useCart(state => state.addToCart);
  const { trackAddToCart } = useAnalytics();

  const trackSuccessfulAddToCart = async (variant: VariantType) => {
    try {
      await addToCart(variant.gid, 1, cartLineAttributes);

      metaTrackAddToCart({
        content_ids: [variant.gid],
        content_name: sanityProductData?.store?.title,
        value: Number(variant?.price) || 0,
        currency: currencyCode || 'USD'
      });

      // GA4 ecommerce `add_to_cart` event pushed to the dataLayer for GTM/GA4.
      trackAddToCart({
        item: {
          id: product?.id || variant.gid,
          name: sanityProductData?.store?.title,
          variant: variant.gid,
          price: variant.price,
          quantity: 1
        },
        currency: currencyCode || 'USD'
      });
    } catch (err) {
      console.error('[Meta] addToCart failed, skipping tracking', err);
    }
  };

  const handleAddToCart = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (showAsRing) {
      setRingDrawerOpen(true);
      return;
    }

    const isSelectedVariantAvailable = selectedVariant?.inventory.isAvailable;
    if (isSelectedVariantAvailable && selectedVariant) {
      await trackSuccessfulAddToCart(selectedVariant);
    }
  };

  const handleRingPurchase = async (variant: VariantType) => {
    if (!variant.inventory.isAvailable) {
      return;
    }

    await trackSuccessfulAddToCart(variant);
    setRingDrawerOpen(false);
  };

  const handleOpenRingDrawer = () => {
    setRingDrawerOpen(true);
  };

  const displayPrice = showAsRing ? ringDisplayPrice : selectedVariant?.price;
  const displayCompareAtPrice = showAsRing ? undefined : selectedVariant?.compareAtPrice;

  const availableOptionsForSelection = useMemo(() => getSelectableOptions(options), [options]);

  const shouldShowVariantOptions = useMemo(() => {
    if (showAsRing) return false;
    return hasMeaningfulVariantChoices(variants, options);
  }, [showAsRing, variants, options]);

  return (
    <div>
      <form onSubmit={handleAddToCart} className={styles.form}>
        <input id="quantity" name="quantity" type="hidden" min="1" max="1" value="1" />

        {shouldShowVariantOptions &&
          availableOptionsForSelection.map(option => (
            <div key={option.name} className={styles.optionGroup}>
              <Text as="label" size="b2" className={styles.optionGroupLabel} text={option.name} />

              <div className={styles.options}>
                {option.values.map(value => {
                  const inputId = `${option.name}-${value}`;
                  const isAvailable = isOptionValueAvailable(option.name, value);
                  const isSelected = selectedOptions[option.name] === value;
                  return (
                    <div key={value} className={styles.option}>
                      <input
                        type="radio"
                        id={inputId}
                        name={option.name}
                        value={value}
                        checked={selectedOptions[option.name] === value}
                        onChange={() => handleOptionChange(option.name, value)}
                        className={styles.optionInput}
                      />
                      <label
                        htmlFor={inputId}
                        className={classNames(styles.optionLabel, {
                          [styles.selected]: isSelected,
                          [styles.notAvailable]: !isAvailable
                        })}
                      >
                        {value}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        {!hidePrice && (
          <div className={styles.price}>
            <Price
              price={displayPrice || '0'}
              compareAtPrice={displayCompareAtPrice}
              inquiryEnabled={sanityProductData?.inquireButtonEnabled}
              inquirePriceText={sanityProductData?.inquirePriceText}
            />
          </div>
        )}

        <div className={styles.action}>
          {!sanityProductData?.inquireButtonEnabled && (
            <AddToCartButton
              disabled={!hasAvailableVariants}
              isRing={showAsRing}
              onSelectSize={handleOpenRingDrawer}
            />
          )}
          {sanityProductData?.inquireButtonEnabled && (
            <InquireButton label={sanityProductData?.inquireButtonLabel || 'Make an Inquiry'} />
          )}
        </div>
      </form>

      {showAsRing && (
        <RingSizeDrawer
          show={ringDrawerOpen}
          onClose={() => setRingDrawerOpen(false)}
          variants={variants}
          options={options}
          onPurchase={handleRingPurchase}
          onOpenSizeGuide={onOpenSizeGuide}
          showSizeChartLink={showSizeChartLink}
        />
      )}
    </div>
  );
};

export default Form;
