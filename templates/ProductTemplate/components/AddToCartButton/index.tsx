'use client';

import React from 'react';
import Button from '@/components/Button';
import { useCart } from '@/tools/store/useCart';

type AddToCartButtonProps = {
  disabled: boolean;
  isRing?: boolean;
  onSelectSize?: () => void;
};

const AddToCartButton = (props: AddToCartButtonProps) => {
  const { disabled: isOutOfStock, isRing = false, onSelectSize } = props;
  const isAdding = useCart(state => state.isAdding);
  const isUpdating = useCart(state => state.isUpdating) || isOutOfStock;

  const getButtonText = () => {
    if (isOutOfStock) return 'Out of stock';
    if (isAdding) return 'Adding to cart...';
    if (isRing) return 'Select Size';
    return 'Purchase';
  };

  if (isRing) {
    return (
      <Button type="button" disabled={isUpdating} variant="square" onClick={onSelectSize}>
        {getButtonText()}
      </Button>
    );
  }

  return (
    <Button type="submit" disabled={isUpdating} variant="square">
      {getButtonText()}
    </Button>
  );
};

export default AddToCartButton;
