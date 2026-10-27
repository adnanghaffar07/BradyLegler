/**
 * The configurator's option vocabulary.
 *
 * This file is imported by the Sanity schema as well as by the configurator, so the
 * dropdowns an editor sees and the values the code matches on cannot drift apart.
 *
 * It must stay free of imports from the component tree. The Sanity Studio builds this
 * module, and pulling React or a `'use client'` file in through here would break that
 * build for no benefit.
 */

export type Metal = 'Yellow Gold' | 'White Gold' | 'Platinum';

export type Finish =
  // Plain - no enamel, no stone
  | 'Plain'
  // Stones
  | 'Diamond'
  | 'Black Diamond'
  | 'Blue Sapphire'
  | 'Pink Sapphire'
  | 'Emerald'
  | 'Ruby'
  | 'Aqua Marine'
  // Enamels
  | 'White Enamel'
  | 'Black Enamel'
  | 'Blue Enamel'
  | 'Hot Pink Enamel'
  | 'Teal Enamel'
  | 'Red Enamel'
  | 'Coral Enamel';

export const METALS: Metal[] = ['Yellow Gold', 'White Gold', 'Platinum'];

/** Stones first, then enamels - matches how the client lists them. */
export const FINISHES: Finish[] = [
  'Plain',
  'Diamond',
  'Black Diamond',
  'Blue Sapphire',
  'Pink Sapphire',
  'Emerald',
  'Ruby',
  'Aqua Marine',
  'White Enamel',
  'Black Enamel',
  'Blue Enamel',
  'Hot Pink Enamel',
  'Teal Enamel',
  'Red Enamel',
  'Coral Enamel'
];

/**
 * The same values as plain strings, for Sanity's `options.list`. Sanity wants a
 * string[]; the typed arrays above are what the configurator matches on.
 */
export const METAL_OPTIONS: string[] = [...METALS];
export const FINISH_OPTIONS: string[] = [...FINISHES];
