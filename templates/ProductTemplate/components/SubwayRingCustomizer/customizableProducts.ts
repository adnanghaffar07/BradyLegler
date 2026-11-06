import type { Metal } from './options';

/**
 * Products that open with the ring customizer, and the metal each starts on.
 *
 * This list drives the product page (which pages show the customizer) and the
 * /customize page (which pieces are listed), so adding a product here is all it takes
 * to make it customizable. Both double band rings share one set of customizer images,
 * uploaded on whichever of the pair has them - see the product projection.
 */
export type CustomizableProduct = {
  handle: string;
  defaultMetal: Metal;
};

export const CUSTOMIZABLE_PRODUCTS: CustomizableProduct[] = [
  { handle: 'subway-double-band-ring-yellow-gold', defaultMetal: 'Yellow Gold' },
  { handle: 'subway-double-band-ring-white-gold', defaultMetal: 'White Gold' }
];

export const CUSTOMIZABLE_PRODUCT_HANDLES = CUSTOMIZABLE_PRODUCTS.map(product => product.handle);

export const getCustomizableProduct = (handle?: string | null) =>
  CUSTOMIZABLE_PRODUCTS.find(product => product.handle === handle);
