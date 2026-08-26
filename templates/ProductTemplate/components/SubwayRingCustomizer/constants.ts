export type Metal = 'Yellow Gold' | 'White Gold' | 'Platinum';
export type Stone = 'Diamond' | 'Ruby' | 'Sapphire' | 'Emerald';

export const METALS: Metal[] = ['Yellow Gold', 'White Gold', 'Platinum'];
export const STONES: Stone[] = ['Diamond', 'Ruby', 'Sapphire', 'Emerald'];

// Placeholder figures only - the client has not yet provided final pricing for the
// customizable Subway Double Band Ring. Swap these for real numbers once received.
export const BASE_PRICE = 6250;

export const METAL_PRICE_MODIFIER: Record<Metal, number> = {
  'Yellow Gold': 0,
  'White Gold': 200,
  Platinum: 800
};

export const STONE_PRICE_MODIFIER: Record<Stone, number> = {
  Diamond: 0,
  Ruby: 400,
  Sapphire: 300,
  Emerald: 500
};

export const STONE_GRADIENT: Record<Stone, { from: string; mid: string; to: string }> = {
  Diamond: { from: '#FFFFFF', mid: '#E3E6EC', to: '#B9C0CC' },
  Ruby: { from: '#F19E9E', mid: '#B3122A', to: '#6E0A19' },
  Sapphire: { from: '#9FB8F0', mid: '#1E3F9E', to: '#0F1F52' },
  Emerald: { from: '#9BE0B8', mid: '#137A47', to: '#0A4B2B' }
};

export const METAL_GRADIENT: Record<Metal, { from: string; mid: string; to: string; stroke: string }> = {
  'Yellow Gold': { from: '#F4E3B0', mid: '#D8B871', to: '#B8934C', stroke: '#8C6A2E' },
  'White Gold': { from: '#F6F6F4', mid: '#E3E2DC', to: '#C7C5BC', stroke: '#9C9A90' },
  Platinum: { from: '#E9EBED', mid: '#C7CBCF', to: '#9BA0A6', stroke: '#71767C' }
};
