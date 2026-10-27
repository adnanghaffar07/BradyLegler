// Reversible Subway Double Band Ring: one ring the wearer can flip for a different
// look ("two rings in one"). Side One and Side Two are the two faces of the ring.
// Each side is a double band carrying one finish across both of its bands, and the
// metal is one choice for the whole ring - changing it changes both sides.
//
// The option set and SKU rules below come from the client's "SKU VARIATIONS"
// document, which is the authoritative spec: every side is either a pavé STONE or an
// ENAMEL (or plain), and the SKU encodes metal + both sides + size.

// The option vocabulary lives in options.ts so the Sanity schema can share it
// without importing anything from the component tree. Re-exported here so every
// existing importer of constants.ts is untouched.
export type { Metal, Finish } from './options';
export { METALS, FINISHES } from './options';

import type { Metal, Finish, ConfiguratorImage } from './options';
import { FINISHES } from './options';

export type SideKey = 'sideOne' | 'sideTwo';

export type FinishKind = 'none' | 'stone' | 'enamel';

export const SIDES: { key: SideKey; label: string }[] = [
  { key: 'sideOne', label: 'Side One' },
  { key: 'sideTwo', label: 'Side Two' }
];

export const STONE_FINISHES: Finish[] = [
  'Diamond',
  'Black Diamond',
  'Blue Sapphire',
  'Pink Sapphire',
  'Emerald',
  'Ruby',
  'Aqua Marine'
];

export const ENAMEL_FINISHES: Finish[] = [
  'White Enamel',
  'Black Enamel',
  'Blue Enamel',
  'Hot Pink Enamel',
  'Teal Enamel',
  'Red Enamel',
  'Coral Enamel'
];

export const FINISH_KIND: Record<Finish, FinishKind> = {
  Plain: 'none',
  Diamond: 'stone',
  'Black Diamond': 'stone',
  'Blue Sapphire': 'stone',
  'Pink Sapphire': 'stone',
  Emerald: 'stone',
  Ruby: 'stone',
  'Aqua Marine': 'stone',
  'White Enamel': 'enamel',
  'Black Enamel': 'enamel',
  'Blue Enamel': 'enamel',
  'Hot Pink Enamel': 'enamel',
  'Teal Enamel': 'enamel',
  'Red Enamel': 'enamel',
  'Coral Enamel': 'enamel'
};

// Defaults chosen so the configurator opens on a combination we have real
// photography for - the demo should show product, not the fallback illustration.
export const DEFAULT_METAL: Metal = 'Yellow Gold';
export const DEFAULT_SIDE_ONE_FINISH: Finish = 'Blue Sapphire';
export const DEFAULT_SIDE_TWO_FINISH: Finish = 'Coral Enamel';

// ---------------------------------------------------------------- SKU

export const SKU_PREFIX = 'BL-SW-R-001';

export const METAL_SKU_CODE: Record<Metal, string> = {
  'Yellow Gold': 'YG',
  'White Gold': 'WG',
  Platinum: 'P'
};

export const FINISH_SKU_CODE: Record<Finish, string> = {
  Plain: '',
  Diamond: 'D',
  'Black Diamond': 'BD',
  'Blue Sapphire': 'BLS',
  'Pink Sapphire': 'PS',
  Emerald: 'E',
  Ruby: 'R',
  'Aqua Marine': 'AM',
  'White Enamel': 'WE',
  'Black Enamel': 'BE',
  'Blue Enamel': 'BLE',
  'Hot Pink Enamel': 'HPE',
  'Teal Enamel': 'TE',
  'Red Enamel': 'RE',
  'Coral Enamel': 'CE'
};

/** Canonical ordering used when a SKU lists two finishes of the same kind. */
const ENAMEL_ORDER: Finish[] = [
  'White Enamel',
  'Black Enamel',
  'Blue Enamel',
  'Hot Pink Enamel',
  'Teal Enamel',
  'Red Enamel',
  'Coral Enamel'
];
const STONE_ORDER: Finish[] = [
  'Diamond',
  'Black Diamond',
  'Blue Sapphire',
  'Pink Sapphire',
  'Emerald',
  'Ruby',
  'Aqua Marine'
];

const orderBy = (order: Finish[], a: Finish, b: Finish): [Finish, Finish] =>
  order.indexOf(a) <= order.indexOf(b) ? [a, b] : [b, a];

export type SideConfiguration = {
  metal: Metal;
  finish: Finish;
};

export type RingConfiguration = {
  sideOne: SideConfiguration;
  sideTwo: SideConfiguration;
};

/**
 * Builds the variant SKU for a configuration, following the client's document:
 *
 *   enamel + stone   ->  {M}-{ENAMEL}-{STONE}        e.g. YG-WE-D
 *   enamel + enamel  ->  {M}-{E1}-{E2}-NS            e.g. YG-WE-BE-NS
 *   stone  + stone   ->  {M}-NE-{S1}-{S2}            e.g. YG-NE-D-R
 *   enamel + plain   ->  {M}-{ENAMEL}-NS             e.g. YG-WE-NS
 *   stone  + plain   ->  {M}-NE-{STONE}              e.g. YG-NE-D
 *   plain  + plain   ->  {M}-NE-NS                   e.g. YG-NE-NS
 *
 * Size is appended by the caller as the shopper picks it, so this ends at "-SZ".
 */
export const buildSku = ({ sideOne, sideTwo }: RingConfiguration): string => {
  const metalCode = METAL_SKU_CODE[sideOne.metal];
  const a = sideOne.finish;
  const b = sideTwo.finish;
  const kindA = FINISH_KIND[a];
  const kindB = FINISH_KIND[b];
  const code = (f: Finish) => FINISH_SKU_CODE[f];

  const parts: string[] = [SKU_PREFIX, metalCode];

  if (kindA === 'enamel' && kindB === 'enamel') {
    const [first, second] = orderBy(ENAMEL_ORDER, a, b);
    parts.push(code(first), code(second), 'NS');
  } else if (kindA === 'stone' && kindB === 'stone') {
    const [first, second] = orderBy(STONE_ORDER, a, b);
    parts.push('NE', code(first), code(second));
  } else if (kindA === 'enamel' || kindB === 'enamel') {
    const enamel = kindA === 'enamel' ? a : b;
    const other = kindA === 'enamel' ? b : a;
    parts.push(code(enamel), FINISH_KIND[other] === 'stone' ? code(other) : 'NS');
  } else {
    // No enamel on either side: a single stone, or nothing at all.
    const stone = kindA === 'stone' ? a : kindB === 'stone' ? b : null;
    parts.push('NE', stone ? code(stone) : 'NS');
  }

  return `${parts.join('-')}-SZ`;
};

// ---------------------------------------------------------------- photography

/**
 * Client photography, keyed per SIDE as `{metal}-{finish}`. Each photo shows one
 * side of the ring - both of its bands - so the same pool serves Side One and Side
 * Two. Anything not listed falls back to the generated illustration, which is how
 * Platinum and the unphotographed finishes render.
 */
/** The shape the product projection returns. Declared in options.ts; see there. */
export type { ConfiguratorImage } from './options';

/**
 * Metals we can borrow photography from when a shot is missing. Platinum and white
 * gold are near-indistinguishable in these studio shots, so platinum shows the white
 * gold frame rather than dropping to the illustration. Only ever substitutes between
 * visually equivalent metals, and only when platinum has no photograph of its own.
 */
const PHOTO_METAL_FALLBACK: Partial<Record<Metal, Metal>> = {
  Platinum: 'White Gold'
};

/** Every photo we hold, for preloading so finish changes swap instantly. */
export const getAllSideImages = (images: ConfiguratorImage[]): string[] =>
  images.map(image => image.src).filter((src): src is string => Boolean(src));

/**
 * Photo URL for one side, or undefined when we have no usable shot for it - which is
 * what makes the configurator fall back to the generated illustration.
 *
 * A row with no `src` is treated as absent rather than rendered, so an asset deleted
 * in Sanity degrades to the illustration instead of an empty <img>.
 */
export const getSideImage = (
  side: SideConfiguration,
  images: ConfiguratorImage[]
): string | undefined => {
  const match = (metal: Metal | undefined): string | undefined => {
    if (!metal) return undefined;
    return images.find(image => image.metal === metal && image.finish === side.finish && image.src)?.src ?? undefined;
  };

  return match(side.metal) ?? match(PHOTO_METAL_FALLBACK[side.metal]);
};


// ---------------------------------------------------------------- pricing

// Pricing from the client's "Customizable Stone Pricing Matrix" (Oct 2026).
//
// CONFIRMED BY THE CLIENT: these are RETAIL figures, not cost - they are added to
// the base price as-is, with no markup applied anywhere in this file.
//
// The matrix is additive per side: the quoted combo price is always the sum of the
// two sides' stone prices, with enamel costing nothing. Verified against all 14
// combo rows in the sheet - every one matches - so the per-side modifiers below
// reproduce the sheet exactly.
//
// Stone prices are for the 51 x 1.2mm round setting on one side of the ring.

// Derived, not supplied: the matrix prices stones only. 5975.50 + Diamond (274.50)
// = $6,250.00, which is what the Yellow Gold / White Enamel / Diamond SKU sells for
// in Shopify today - the one configuration that can be cross-checked. Confirm with
// the client before this is treated as settled.
export const BASE_PRICE = 5975.5;

// The matrix covers stones only; metal carries no uplift. Platinum inherits white
// gold pricing per the client, matching the photography fallback where platinum also
// borrows the white gold shots. Metal therefore does not affect the total - price
// moves on stones alone.
export const METAL_PRICE_MODIFIER: Record<Metal, number> = {
  'Yellow Gold': 0,
  'White Gold': 0,
  Platinum: 0
};

export const FINISH_PRICE_MODIFIER: Record<Finish, number> = {
  // No stones set - no stone cost.
  Plain: 0,

  // Priced directly from the matrix.
  Diamond: 274.5,
  Emerald: 320,
  Ruby: 250,
  // The sheet prices sapphire as one line covering "Blue, Pink, Yellow".
  'Blue Sapphire': 250,
  'Pink Sapphire': 250,

  // Confirmed by the client (Oct 2026): black diamond is priced the same as sapphire.
  'Black Diamond': 250,

  // STILL OUTSTANDING - the client has not given an aqua marine figure yet. Held at
  // the sapphire price so the configurator cannot under-quote; replace on confirmation.
  'Aqua Marine': 250,

  // Enamel adds nothing - confirmed by every "X/Enamel" row in the matrix.
  'White Enamel': 0,
  'Black Enamel': 0,
  'Blue Enamel': 0,
  'Hot Pink Enamel': 0,
  'Teal Enamel': 0,
  'Red Enamel': 0,
  'Coral Enamel': 0
};

// ---------------------------------------------------------------- appearance

export const METAL_GRADIENT: Record<Metal, { from: string; mid: string; to: string; stroke: string }> = {
  'Yellow Gold': { from: '#F4E3B0', mid: '#D8B871', to: '#B8934C', stroke: '#8C6A2E' },
  'White Gold': { from: '#F6F6F4', mid: '#E3E2DC', to: '#C7C5BC', stroke: '#9C9A90' },
  Platinum: { from: '#E9EBED', mid: '#C7CBCF', to: '#9BA0A6', stroke: '#71767C' }
};

/** Fills for the illustration fallback. Sampled from the client's photography. */
export const FINISH_GRADIENT: Record<Finish, { from: string; mid: string; to: string }> = {
  Plain: { from: '#FFFFFF', mid: '#FFFFFF', to: '#FFFFFF' },
  Diamond: { from: '#FFFFFF', mid: '#E3E6EC', to: '#B9C0CC' },
  'Black Diamond': { from: '#8A8A8A', mid: '#2B2B2B', to: '#0A0A0A' },
  'Blue Sapphire': { from: '#7E9BE0', mid: '#1E3F9E', to: '#0F1F52' },
  'Pink Sapphire': { from: '#F7B6C8', mid: '#E2698C', to: '#A93B5C' },
  Emerald: { from: '#7FD3A6', mid: '#137A47', to: '#0A4B2B' },
  Ruby: { from: '#D93A3A', mid: '#9B0F1E', to: '#4E0810' },
  'Aqua Marine': { from: '#CDE9F7', mid: '#8FC7E8', to: '#4E8FB8' },
  'White Enamel': { from: '#FFFFFF', mid: '#F2F1EC', to: '#D8D6CE' },
  'Black Enamel': { from: '#5E5E5E', mid: '#1C1C1C', to: '#000000' },
  'Blue Enamel': { from: '#4A6BC4', mid: '#1B3A8C', to: '#0D1E4C' },
  'Hot Pink Enamel': { from: '#F58CC4', mid: '#E8469B', to: '#A81E66' },
  'Teal Enamel': { from: '#B5E3DD', mid: '#7FCBC4', to: '#479A92' },
  'Red Enamel': { from: '#F26457', mid: '#E03127', to: '#92160F' },
  'Coral Enamel': { from: '#F9A892', mid: '#F2795E', to: '#B4452F' }
};

/** Swatch fills for the finish picker. */
export const FINISH_SWATCH: Record<Finish, string> = {
  Plain: 'transparent',
  Diamond: '#E3E6EC',
  'Black Diamond': '#2B2B2B',
  'Blue Sapphire': '#1E3F9E',
  'Pink Sapphire': '#E2698C',
  Emerald: '#137A47',
  Ruby: '#9B0F1E',
  'Aqua Marine': '#8FC7E8',
  'White Enamel': '#F2F1EC',
  'Black Enamel': '#1C1C1C',
  'Blue Enamel': '#1B3A8C',
  'Hot Pink Enamel': '#E8469B',
  'Teal Enamel': '#7FCBC4',
  'Red Enamel': '#E03127',
  'Coral Enamel': '#F2795E'
};

// ---------------------------------------------------------------- descriptions

export const describeFinish = (finish: Finish): string =>
  finish === 'Plain' ? 'No stone or enamel' : finish;

/** Short label for the picker, where the group heading supplies the context. */
export const shortFinishLabel = (finish: Finish): string =>
  FINISH_KIND[finish] === 'enamel' ? finish.replace(' Enamel', '') : finish;

/**
 * Shopify line-item attributes describing a configuration.
 *
 * These ride along with the cart line and appear in the cart, at checkout and on the
 * order, so the shopper sees what they built and fulfilment knows what to make.
 *
 * NOTE: attributes are descriptive only - Shopify still charges the variant's own
 * price. The configured total shown in the UI is NOT what gets charged. Charging a
 * configured price needs a separate mechanism (draft orders, a Shopify Function, or
 * per-configuration variants).
 */
export const buildCartAttributes = (
  configuration: RingConfiguration,
  configuredPrice?: string
): { key: string; value: string }[] => {
  const attributes = [
    { key: 'Metal', value: configuration.sideOne.metal },
    { key: 'Side One', value: describeFinish(configuration.sideOne.finish) },
    { key: 'Side Two', value: describeFinish(configuration.sideTwo.finish) },
    { key: 'Configuration SKU', value: buildSku(configuration) }
  ];

  if (configuredPrice) {
    attributes.push({ key: 'Configured Price', value: configuredPrice });
  }

  return attributes;
};

/** Human-readable description of one side, for the final product display. */
export const describeSide = ({ metal, finish }: SideConfiguration): string =>
  `${metal}, ${describeFinish(finish)}`;
