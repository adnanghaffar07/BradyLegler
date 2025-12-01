'use client';

import { useCart } from '@/tools/store/useCart';
import { useEffect, useState } from 'react';
import Button from '@/components/Button';
import styles from './styles.module.scss';

const HeaderNavigationCart = () => {
  const cart = useCart(state => state.cart);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleToggleCart = () => {
    useCart.getState().toggleCart();
  };

  if (!isMounted) return null;

  return (
    // <Button
    //   variant="normal-sm"
    //   className={styles.container}
    //   onClick={handleToggleCart}
    //   text={`Yours (${cart?.totalQuantity || 0})`}
    // />
  );
};

export default HeaderNavigationCart;
