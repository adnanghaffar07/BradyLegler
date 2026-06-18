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
import { trackAddToCart as metaTrackAddToCart } from '@/lib/meta';
import { getDisplayableCartSelectedOptions } from '@/lib/productOptions';
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
            <Text weight="medium" size="b2" text="Total" />
            <Text size="b3" text={`${cart?.cost?.subtotalAmount?.amount || '0.0'} ${currency}`} />
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
  const displayableOptions = getDisplayableCartSelectedOptions(node?.merchandise?.selectedOptions);

  const handleMinus = async () => {
    try {
      await updateCart(node.id, node.quantity - 1);
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
    } catch (err) {
      console.error('Cart update failed', err);
    }
  };

  const handleAdd = async () => {
    try {
      await updateCart(node.id, node.quantity + 1);

      // Use lib/meta tracking after successful update (guard prevents duplicates)
      if (typeof window !== 'undefined' && metaTrackAddToCart) {
        try {
          metaTrackAddToCart({
            content_ids: [node.merchandise.product.id],
            content_name: node.merchandise.product.title,
            value: Number(node.merchandise.priceV2.amount) || 0,
            currency: node.cost.totalAmount.currencyCode
          });
        } catch (err) {
          // ignore
        }
      }

      // Also send analytics GTM event
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
    } catch (err) {
      console.error('Cart update failed', err);
    }
  };

  const handleRemove = async () => {
    try {
      await updateCart(node.id, 0);
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
    } catch (err) {
      console.error('Cart update failed', err);
    }
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
        {displayableOptions.length > 0 && (
          <div className={styles.selectedOptions}>
            {displayableOptions.map((option, i) => (
              <div className={styles.selectedOption} key={i}>
                <Text as="p" size="b2" text={option.name} className={styles.selectedOptionName} />
                <Text as="p" size="b3" text={option.value} className={styles.selectedOptionValue} />
              </div>
            ))}
          </div>
        )}
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
