// Reversible Subway Double Band Ring: one ring the wearer can flip for a different
// look ("two rings in one"). Side One and Side Two are the two faces of the ring -
// Side Two is the reverse, not the inside. Each side is a double band: the top and
// bottom bands take their own stone/enamel, while the metal is chosen once per side.

export type SideKey = 'sideOne' | 'sideTwo';

export type Metal = 'White Gold' | 'Yellow Gold' | 'Platinum';

export type Finish =
  | 'No Enamel or Stone'
  | 'Diamond'
  | 'Ruby'
  | 'White Enamel'
  | 'Black Enamel'
  | 'Blue Enamel'
  | 'Emerald'
  | 'Blue Sapphire'
  | 'Pink Sapphire'
  | 'Black Diamond';

// How each finish is rendered on the bands.
export type FinishKind = 'none' | 'stone' | 'enamel';

export const SIDES: { key: SideKey; label: string }[] = [
  { key: 'sideOne', label: 'Side One' },
  { key: 'sideTwo', label: 'Side Two' }
];

// Both sides offer the same options - the sides differ only in what the customer picks.
export const METALS: Metal[] = ['White Gold', 'Yellow Gold', 'Platinum'];

export const FINISHES: Finish[] = [
  'No Enamel or Stone',
  'Diamond',
  'Ruby',
  'White Enamel',
  'Black Enamel',
  'Blue Enamel',
  'Emerald',
  'Blue Sapphire',
  'Pink Sapphire',
  'Black Diamond'
];

export const DEFAULT_METAL: Metal = 'White Gold';
export const DEFAULT_SIDE_ONE_FINISH: Finish = 'Diamond';
export const DEFAULT_SIDE_TWO_FINISH: Finish = 'Black Enamel';

// The two bands on a side, each independently configurable.
export type BandKey = 'top' | 'bottom';

export const BANDS: { key: BandKey; label: string }[] = [
  { key: 'top', label: 'Top Band' },
  { key: 'bottom', label: 'Bottom Band' }
];

export const FINISH_KIND: Record<Finish, FinishKind> = {
  'No Enamel or Stone': 'none',
  Diamond: 'stone',
  Ruby: 'stone',
  'White Enamel': 'enamel',
  'Black Enamel': 'enamel',
  'Blue Enamel': 'enamel',
  Emerald: 'stone',
  'Blue Sapphire': 'stone',
  'Pink Sapphire': 'stone',
  'Black Diamond': 'stone'
};

// Placeholder figures only - Megan's team has not yet supplied final pricing for the
// reversible Subway ring. Swap these for real numbers once received.
export const BASE_PRICE = 6250;

export const METAL_PRICE_MODIFIER: Record<Metal, number> = {
  'White Gold': 0,
  'Yellow Gold': 0,
  Platinum: 800
};

export const FINISH_PRICE_MODIFIER: Record<Finish, number> = {
  'No Enamel or Stone': 0,
  Diamond: 1200,
  Ruby: 900,
  'White Enamel': 450,
  'Black Enamel': 450,
  'Blue Enamel': 450,
  Emerald: 1000,
  'Blue Sapphire': 950,
  'Pink Sapphire': 950,
  'Black Diamond': 1100
};

export const METAL_GRADIENT: Record<Metal, { from: string; mid: string; to: string; stroke: string }> = {
  'White Gold': { from: '#F6F6F4', mid: '#E3E2DC', to: '#C7C5BC', stroke: '#9C9A90' },
  'Yellow Gold': { from: '#F4E3B0', mid: '#D8B871', to: '#B8934C', stroke: '#8C6A2E' },
  Platinum: { from: '#E9EBED', mid: '#C7CBCF', to: '#9BA0A6', stroke: '#71767C' }
};

// Fills for the stone / enamel finishes. 'No Enamel or Stone' has no fill - the band
// is left as bare metal.
export const FINISH_GRADIENT: Record<Finish, { from: string; mid: string; to: string }> = {
  'No Enamel or Stone': { from: '#FFFFFF', mid: '#FFFFFF', to: '#FFFFFF' },
  Diamond: { from: '#FFFFFF', mid: '#E3E6EC', to: '#B9C0CC' },
  Ruby: { from: '#D93A3A', mid: '#9B0F1E', to: '#4E0810' },
  'White Enamel': { from: '#FFFFFF', mid: '#F2F1EC', to: '#D8D6CE' },
  'Black Enamel': { from: '#5E5E5E', mid: '#1C1C1C', to: '#000000' },
  'Blue Enamel': { from: '#7FA0E8', mid: '#1E3F9E', to: '#0F1F52' },
  Emerald: { from: '#9BE0B8', mid: '#137A47', to: '#0A4B2B' },
  'Blue Sapphire': { from: '#A9C2FA', mid: '#2A55C8', to: '#14286B' },
  'Pink Sapphire': { from: '#F7B6C8', mid: '#E2698C', to: '#A93B5C' },
  'Black Diamond': { from: '#8A8A8A', mid: '#2B2B2B', to: '#0A0A0A' }
};

// Swatch fills for the finish picker.
export const FINISH_SWATCH: Record<Finish, string> = {
  'No Enamel or Stone': 'transparent',
  Diamond: '#E3E6EC',
  Ruby: '#B3122A',
  'White Enamel': '#F2F1EC',
  'Black Enamel': '#1C1C1C',
  'Blue Enamel': '#1E3F9E',
  Emerald: '#137A47',
  'Blue Sapphire': '#2A55C8',
  'Pink Sapphire': '#E2698C',
  'Black Diamond': '#2B2B2B'
};

export type SideConfiguration = {
  metal: Metal;
  top: Finish;
  bottom: Finish;
};

export type RingConfiguration = {
  sideOne: SideConfiguration;
  sideTwo: SideConfiguration;
};

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

/**
 * Stable key for one exact configuration, e.g.
 * "white-gold-diamond__yellow-gold-black-enamel". Used to look up client-supplied
 * photography once it lands.
 */
const slugSide = ({ metal, top, bottom }: SideConfiguration) =>
  `${slug(metal)}-${slug(top)}-${slug(bottom)}`;

export const buildConfigKey = ({ sideOne, sideTwo }: RingConfiguration): string =>
  `${slugSide(sideOne)}__${slugSide(sideTwo)}`;

/**
 * Real product photography, keyed by buildConfigKey(). Empty until Megan's team
 * delivers the assets - drop the image URLs in here and the customizer will render
 * them instead of the generated illustration. No other code needs to change.
 */
export const RING_IMAGE_ASSETS: Record<string, string> = {};

export const getRingImageAsset = (configuration: RingConfiguration): string | undefined =>
  RING_IMAGE_ASSETS[buildConfigKey(configuration)];

export const describeFinish = (finish: Finish): string =>
  finish === 'No Enamel or Stone' ? 'No stone or enamel' : finish;

/** Human-readable description of one side, for the final product display. */
export const describeSide = ({ metal, top, bottom }: SideConfiguration): string =>
  top === bottom
    ? `${metal}, ${describeFinish(top)}`
    : `${metal} - top ${describeFinish(top)}, bottom ${describeFinish(bottom)}`;
