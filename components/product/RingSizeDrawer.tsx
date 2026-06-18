'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SidePanel from '@/components/SidePanel';
import Button from '@/components/Button';
import Text from '@/components/Text';
import classNames from '@/tools/helpers/classNames';
import { useCart } from '@/tools/store/useCart';
import {
  compareRingVariants,
  getRingDiameter,
  getVariantRingSize
} from '@/lib/ringSizes';
import styles from './RingSizeDrawer.module.scss';

type RingVariant = {
  gid: string;
  title: string;
  price?: string;
  inventory: { isAvailable: boolean };
  option1?: string;
  option2?: string;
  option3?: string;
};

type ProductOption = {
  name: string;
};

type RingSizeDrawerProps = {
  show: boolean;
  onClose: () => void;
  variants: RingVariant[];
  options: ProductOption[];
  onPurchase: (variant: RingVariant) => Promise<void>;
  onOpenSizeGuide?: () => void;
  showSizeChartLink?: boolean;
};

const RingSizeDrawer: React.FC<RingSizeDrawerProps> = ({
  show,
  onClose,
  variants,
  options,
  onPurchase,
  onOpenSizeGuide,
  showSizeChartLink = false
}) => {
  const [selectedVariantGid, setSelectedVariantGid] = useState<string | null>(null);
  const [validationError, setValidationError] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const isAdding = useCart(state => state.isAdding);
  const isUpdating = useCart(state => state.isUpdating);

  const availableVariants = useMemo(
    () =>
      variants
        .filter(variant => variant.inventory.isAvailable)
        .sort((a, b) => compareRingVariants(a, b, options)),
    [variants, options]
  );

  const selectedVariant = useMemo(
    () => availableVariants.find(variant => variant.gid === selectedVariantGid) ?? null,
    [availableVariants, selectedVariantGid]
  );

  useEffect(() => {
    if (!show) {
      setSelectedVariantGid(null);
      setValidationError(false);
      setAnnouncement('');
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [show]);

  const handleSelectSize = useCallback((variant: RingVariant) => {
    setSelectedVariantGid(variant.gid);
    setValidationError(false);

    const size = getVariantRingSize(variant, options);
    if (size) {
      setAnnouncement(`Size ${size} selected`);
    }
  }, [options]);

  const handlePurchase = async () => {
    if (!selectedVariant) {
      setValidationError(true);
      setAnnouncement('Please select a ring size');
      return;
    }

    await onPurchase(selectedVariant);
  };

  const handleOpenSizeGuide = () => {
    onOpenSizeGuide?.();
  };

  return (
    <SidePanel
      title="Select US Size"
      show={show}
      onClose={onClose}
      trapFocus
      closeOnEscape
      ariaLabel="Select US ring size"
    >
      <SidePanel.Body>
        <div className={styles.content}>
          <div className={styles.sizeList} role="radiogroup" aria-label="Available ring sizes">
            {availableVariants.map(variant => {
              const size = getVariantRingSize(variant, options);
              if (!size) {
                return null;
              }

              const diameter = getRingDiameter(size) ?? '';
              const isSelected = selectedVariantGid === variant.gid;
              const inputId = `ring-size-${variant.gid}`;

              return (
                <div key={variant.gid} className={styles.sizeRow}>
                  <input
                    type="radio"
                    id={inputId}
                    name="ring-size"
                    value={size}
                    checked={isSelected}
                    onChange={() => handleSelectSize(variant)}
                    className={styles.sizeInput}
                  />
                  <label
                    htmlFor={inputId}
                    className={classNames(styles.sizeLabel, { [styles.selected]: isSelected })}
                  >
                    <Text as="span" size="b2" text={size} />
                    <Text as="span" size="b2" text={diameter} className={styles.diameter} />
                  </label>
                </div>
              );
            })}
          </div>

          {showSizeChartLink && onOpenSizeGuide && (
            <div className={styles.sizeChartLink}>
              <Button onClick={handleOpenSizeGuide} text="View Size Chart" variant="normal-sm" />
            </div>
          )}

          {validationError && (
            <p className={styles.validationError} role="alert">
              Please select a ring size
            </p>
          )}

          <div className={styles.srOnly} aria-live="polite" aria-atomic="true">
            {announcement}
          </div>
        </div>
      </SidePanel.Body>

      <SidePanel.Footer className={styles.footer}>
        <Button
          onClick={handlePurchase}
          variant="square"
          disabled={!selectedVariant || isUpdating || isAdding}
          className={styles.purchaseButton}
        >
          {isAdding ? 'Adding to cart...' : 'Purchase'}
        </Button>
      </SidePanel.Footer>
    </SidePanel>
  );
};

export default RingSizeDrawer;
