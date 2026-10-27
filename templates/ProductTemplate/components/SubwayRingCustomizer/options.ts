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

/**
 * One photograph of a customizable product in a given metal and finish, as authored in
 * Sanity and flattened by the product projection. `src` is null when the asset has been
 * deleted in Sanity but the row remains.
 *
 * It lives here rather than in constants.ts so the Sanity schema can type the document
 * field without importing from the component tree.
 */
export type ConfiguratorImage = { metal: string; finish: string; src: string | null };

/**
 * The duplicated `metal / finish` label in a `configuratorImages` array, or null when
 * there is none. Used by the Sanity schema's validation.
 *
 * Rows that are not yet complete are skipped rather than compared. An editor adding
 * thirty rows one at a time will often have two half-filled rows open at once, and
 * comparing those on a built key makes them collide as the literal string
 * "undefined|undefined" - reporting a duplicate that does not exist, in a message
 * naming no values. `required()` on the fields is what reports an incomplete row.
 */
export const findDuplicateCombination = (rows?: { metal?: string; finish?: string }[]): string | null => {
  const seen = new Set<string>();
  for (const row of rows ?? []) {
    if (!row?.metal || !row?.finish) continue;
    const key = `${row.metal}|${row.finish}`;
    if (seen.has(key)) return `${row.metal} / ${row.finish}`;
    seen.add(key);
  }
  return null;
};
