'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AddToCartButton from '../AddToCartButton';
import InquireButton from '../InquireButton';
import Text from '@/components/Text';
import { useCart } from '@/tools/store/useCart';
import { useAnalytics } from '@/tools/analytics';
import { IProductDocument } from '@/tools/sanity/schema/documents/product';
import styles from './styles.module.scss';
import Price from '../Price';
import classNames from 'classnames';

type VariantType = {
  gid: string;
  title: string;
  inventory: { isAvailable: boolean };
  option1?: string;
  option2?: string;
  option3?: string;
};

type FormProps = {
  sanityProductData: IProductDocument;
  setSelectedVariant: React.Dispatch<React.SetStateAction<VariantType | null>>;
  currencyCode?: string;
};

const Form: React.FC<FormProps> = ({ sanityProductData, setSelectedVariant: handleSetSelectVariant, currencyCode }) => {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setVariant] = useState<VariantType | null>(null);
  const { trackAddToCart } = useAnalytics();

  const setSelectedVariant = useCallback((variant: VariantType | null) => {
    setVariant(variant);
    if (handleSetSelectVariant) {
      handleSetSelectVariant(variant);
    }
  }, []);

  const product = sanityProductData?.store;
  const variants = useMemo(() => product?.variants?.map(({ store }) => store) ?? [], [product]);
  const options = product?.options ?? [];
  const minVariantPrice = product?.priceRange?.minVariantPrice;
  const variantPrice = selectedVariant?.price;

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

  // Set first available variant on mount
  useEffect(() => {
    if (variants.length > 0) {
      const firstAvailableVariant = variants.find(v => v.inventory.isAvailable);
      if (firstAvailableVariant) {
        setSelectedVariant(firstAvailableVariant);
        setSelectedOptions(getSelectedOptions(firstAvailableVariant));
      } else {
        setSelectedVariant(null);
        setSelectedOptions({});
      }
    }
  }, [variants, getSelectedOptions]);

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
  const handleAddToCart = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const isSelectedVariantAvailable = selectedVariant?.inventory.isAvailable;
    if (isSelectedVariantAvailable) {
      addToCart(selectedVariant.gid, 1);
      trackAddToCart({
        currency: currencyCode,
        item: {
          id: selectedVariant?.productGid,
          name: sanityProductData?.store?.title,
          category: sanityProductData?.store?.productType,
          price: selectedVariant?.price,
          variant: selectedVariant?.gid,
          quantity: 1
        }
      });
    }
  };

  const availableOptionsForSelection = useMemo(() => {
    return options.map(option => {
      return {
        name: option.name,
        values: option.values
      };
    });
  }, [options, variants, getSelectedOptions]);

  return (
    <div>
      <form onSubmit={handleAddToCart} className={styles.form}>
        <input id="quantity" name="quantity" type="hidden" min="1" max="1" value="1" />

        {availableOptionsForSelection?.length > 1 &&
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

        <div className={styles.price}>
          <Price 
            price={selectedVariant?.price} 
            compareAtPrice={selectedVariant?.compareAtPrice}
            inquiryEnabled={sanityProductData?.inquireButtonEnabled}
            inquirePriceText={sanityProductData?.inquirePriceText}
          />
        </div>

        <div className={styles.action}>
          {!sanityProductData?.inquireButtonEnabled && (
            <AddToCartButton disabled={!selectedVariant?.inventory.isAvailable} />
          )}
          {sanityProductData?.inquireButtonEnabled && (
            <InquireButton label={sanityProductData?.inquireButtonLabel || 'Make an Inquiry'} />
          )}
        </div>
      </form>
    </div>
  );
};

export default Form;
