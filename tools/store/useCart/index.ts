import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createCart, retrieveCart, addToCart, updateCart } from '@/tools/apis/shopify';

type CartStore = {
  cart: any;
  setCart: (cart: any) => void;
  cartId: string | null;
  setCartId: (cartId: string) => void;
  cartOpen: boolean;
  setCartOpen: (cartOpen: boolean) => void;
  toggleCart: () => void;
  isAdding: boolean;
  isUpdating: boolean;
  addToCart: (variantId: string, quantity: number) => void;
  updateCart: (variantId: string, quantity: number) => void;
};

export const useCart = create(
  persist<CartStore>(
    (set, get) => ({
      cart: {},
      setCart: cart => set({ cart }),
      cartId: null,
      setCartId: cartId => {
        sessionStorage.setItem('cartId', cartId);
        set({ cartId });
      },
      cartOpen: false,
      setCartOpen: cartOpen => set({ cartOpen }),
      toggleCart: () => set(state => ({ cartOpen: !state.cartOpen })),
      isAdding: false,
      isUpdating: false,
      addToCart: async (variantId, quantity) => {
        let cartId = get().cartId;
        set({ isUpdating: true });
        set({ isAdding: true });
        if (cartId) {
          await addToCart(cartId, variantId, quantity);
          const cart = await retrieveCart(cartId);
          // If cart retrieval fails, the cart no longer exists (e.g., after checkout)
          // Clear the bad cartId and create a new cart
          if (!cart) {
            sessionStorage.removeItem('cartId');
            set({ cartId: null });
            const newCart = await createCart(variantId, quantity);
            const newCartId = newCart?.id;
            if (newCartId) {
              const retrievedCart = await retrieveCart(newCartId);
              set({ cart: retrievedCart });
              set({ cartId: newCartId });
              sessionStorage.setItem('cartId', newCartId);
            }
          } else {
            set({ cart });
          }
        } else {
          const newCart = await createCart(variantId, quantity);
          const newCartId = newCart?.id;
          if (newCartId) {
            const cart = await retrieveCart(newCartId);
            set({ cart: cart });
            set({ cartId: newCartId });
            sessionStorage.setItem('cartId', newCartId);
          }
        }
        set({ isUpdating: false });
        set({ isAdding: false });
        set({ cartOpen: true });
      },
      updateCart: async (lineId, quantity) => {
        const cartId = get().cartId;
        set({ isUpdating: true });
        if (cartId) {
          await updateCart(cartId, lineId, quantity);
          const cart = await retrieveCart(cartId);
          // If cart retrieval fails, the cart no longer exists
          // Clear the bad cartId and reset cart state
          if (!cart) {
            sessionStorage.removeItem('cartId');
            set({ cartId: null });
            set({ cart: {} });
          } else {
            set({ cart });
          }
        }
        set({ isUpdating: false });
      }
    }),
    {
      name: 'bl.localstorage.cart', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage) // (optional) by default, 'localStorage' is used
    }
  )
);
