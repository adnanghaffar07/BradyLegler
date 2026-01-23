'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from '@/components/Link';
import Text from '../Text';
import Button from '../Button';
import { useCart } from '@/tools/store/useCart';
import classNames from '@/tools/helpers/classNames';
import SidePanel from '@/components/SidePanel';
import { useAnalytics } from '@/tools/analytics';
import styles from './styles.module.scss';

const Cart = () => {
  const cart = useCart(state => state.cart);
  const cartOpen = useCart(state => state.cartOpen);
  const toggleCart = useCart(state => state.toggleCart);
  const pathname = usePathname();
  const { clientId, trackViewCart, trackBeginCheckout } = useAnalytics();
  const currency =
    !cart?.cost?.totalAmount?.currencyCode || cart?.cost?.totalAmount?.currencyCode === 'XXX'
      ? 'USD'
      : cart?.cost?.totalAmount?.currencyCode;

  const handleCloseCart = () => {
    toggleCart();
  };

  useEffect(() => {
    if (cartOpen) {
      toggleCart();
    }
  }, [pathname]);

  useEffect(() => {
    if (cartOpen) {
      trackViewCart({
        items: cart?.lines?.edges?.map(({ node: cartItem }) => ({
          id: cartItem.merchandise.product.id,
          name: cartItem.merchandise.product.title,
          category: cartItem.merchandise.product.productType,
          variant: cartItem.merchandise.id,
          quantity: cartItem.quantity,
          price: cartItem.merchandise.priceV2.amount
        })),
        currency: cart?.cost?.totalAmount?.currencyCode,
        value: cart?.cost?.totalAmount?.amount
      });
    }
  }, [cartOpen]);

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (cartOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Apply styles to lock scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Remove scroll lock styles
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [cartOpen]);

  // Generate the checkout URL with client_id appended
  const checkoutUrl = useMemo(() => {
    if (!cart?.checkoutUrl) return '';
    const url = new URL(cart.checkoutUrl);
    if (clientId) {
      url.searchParams.append('client_id', clientId);
    }
    return url.toString();
  }, [cart?.checkoutUrl, clientId]);

  const onCheckoutClick = useCallback(() => {
    trackBeginCheckout({
      items: cart?.lines?.edges?.map(({ node: cartItem }) => ({
        id: cartItem.merchandise.product.id,
        name: cartItem.merchandise.product.title,
        category: cartItem.merchandise.product.productType,
        variant: cartItem.merchandise.id,
        quantity: cartItem.quantity,
        price: cartItem.merchandise.priceV2.amount
      })),
      currency: cart?.cost?.totalAmount?.currencyCode,
      value: cart?.cost?.totalAmount?.amount
    });
  }, [cart]);

  return (
    <SidePanel title="Cart" show={cartOpen} onClose={handleCloseCart}>
      <SidePanel.Body>
        {cart?.lines?.edges?.map(({ node }, index) => (
          <LineItem node={node} key={`${node.id}_${index}`} />
        ))}

        {!cart?.lines?.edges?.length && (
          <div className={styles.emptyCart}>
            <Text size="b1" text="Make something yours." />
          </div>
        )}
      </SidePanel.Body>

      <SidePanel.Footer className={styles.footer}>
        <div className={styles.totals}>
          <div className={styles.amount}>
            <Text weight="medium" size="b2" text="Subtotal" />
            <Text size="b3" text={`${cart?.cost?.subtotalAmount?.amount || '0.0'} ${currency}`} />
          </div>

          <div className={styles.amount}>
            <Text weight="medium" size="b2" text="Tax" />
            <Text size="b3" text={`${cart?.cost?.totalTaxAmount?.amount || '0.0'} ${currency}`} />
          </div>

          <div className={styles.amount}>
            <Text weight="medium" size="b2" text="Grand Total" />
            <Text size="b3" text={`${cart?.cost?.totalAmount?.amount || '0.0'} ${currency}`} />
          </div>
        </div>

        <Link
          onClick={onCheckoutClick}
          href={checkoutUrl}
          text="Complete"
          variant="square"
          className={classNames({ [styles.checkout]: cartOpen, [styles.disabled]: !cart?.lines?.edges?.length })}
          disabled={!cart?.lines?.edges?.length}
        />
      </SidePanel.Footer>
    </SidePanel>
  );
};

const LineItem = ({ node }) => {
  const isUpdating = useCart(state => state.isUpdating);
  const updateCart = useCart(state => state.updateCart);
  const { trackAddToCart, trackRemoveFromCart } = useAnalytics();

  const handleMinus = () => {
    updateCart(node.id, node.quantity - 1);
    trackRemoveFromCart({
      item: {
        id: node.merchandise.product.id,
        name: node.merchandise.product.title,
        variant: node.merchandise.id,
        price: node.merchandise.priceV2.amount,
        quantity: 1
      },
      currency: node.cost.totalAmount.currencyCode
    });
  };

  const handleAdd = () => {
    updateCart(node.id, node.quantity + 1);
    trackAddToCart({
      item: {
        id: node.merchandise.product.id,
        name: node.merchandise.product.title,
        variant: node.merchandise.id,
        price: node.merchandise.priceV2.amount,
        quantity: 1
      },
      currency: node.cost.totalAmount.currencyCode
    });
  };

  const handleRemove = () => {
    updateCart(node.id, 0);
    trackRemoveFromCart({
      item: {
        id: node.merchandise.product.id,
        name: node.merchandise.product.title,
        variant: node.merchandise.id,
        price: node.merchandise.priceV2.amount,
        quantity: node.quantity
      },
      currency: node.cost.totalAmount.currencyCode
    });
  };

  return (
    <div className={styles.lineItem}>
      <Link className={styles.image} href={`/${node.merchandise.product.handle}/`} variant="content">
        <Image
          src={node.merchandise.image.src}
          alt=""
          width={node.merchandise.image.width}
          height={node.merchandise.image.height}
        />
      </Link>

      <div className={styles.details}>
        <div className={styles.detailsTop}>
          <Link href={`/${node.merchandise.product.handle}/`} variant="content">
            <Text as="p" size="b2" text={node.merchandise.product.title} />
          </Link>
          <Text
            as="p"
            size="b2"
            text={`${node.cost.amountPerQuantity?.amount} ${node.cost.amountPerQuantity?.currencyCode}`}
          />
        </div>
        <div className={styles.selectedOptions}>
          {node?.merchandise?.selectedOptions.map((option, i) => (
            <div className={styles.selectedOption} key={i}>
              <Text key={option.name} as="p" size="b2" text={option.name} className={styles.selectedOptionName} />
              <Text key={option.name} as="p" size="b3" text={option.value} className={styles.selectedOptionValue} />
            </div>
          ))}
        </div>
        <div className={styles.detailsBottom}>
          <div className={styles.quantity}>
            <Button
              onClick={handleMinus}
              variant="normal-sm"
              disabled={isUpdating}
              className={styles.quantityAdjustButton}
            >
              -
            </Button>
            <Text size="b2" className={styles.quantityAmount}>
              {node.quantity}
            </Text>
            <Button
              onClick={handleAdd}
              variant="normal-sm"
              disabled={isUpdating}
              className={styles.quantityAdjustButton}
            >
              +
            </Button>
          </div>
          <Button onClick={handleRemove} variant="normal-sm" disabled={isUpdating}>
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
