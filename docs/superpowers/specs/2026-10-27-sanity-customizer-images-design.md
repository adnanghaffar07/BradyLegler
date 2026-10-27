# Customizer images from Sanity

**Date:** 2026-10-27
**Branch:** `sanity-customizer-images` (from `staging`)
**Dataset:** `staging`
**Status:** awaiting review

## Context

The Subway ring configurator renders 30 photographs, two at a time — one per side
of the ring. They are checked into `public/subway/` and listed in a hardcoded Set in
`constants.ts`, keyed `{metal}-{finish}`:

```ts
const AVAILABLE_SIDE_IMAGES = new Set(['yellow-gold-blue-sapphire', ...]);

export const getSideImage = (side) => {
  const direct = buildSideImageKey(side);
  if (AVAILABLE_SIDE_IMAGES.has(direct)) return `/subway/${direct}.jpg`;
  // Platinum borrows white gold
};
```

Swapping a photograph means a developer renames a file, edits the Set and ships a
commit. Over the past fortnight the client has sent three batches of imagery; each
one needed a developer. They have asked to manage this themselves.

They have also said that Shopify will later model **metal × finish × size** as real
variants, each with its own SKU. Whatever we build has to survive that without a
migration.

## Goals

- The client adds, replaces and removes configurator photography in Sanity, without
  a developer and without a deploy.
- The structure still works when metal and finish become Shopify variant options.
- Missing imagery degrades exactly as it does today — Platinum borrows white gold,
  and anything still missing falls back to the generated illustration.
- No change to what a customer sees while the imagery is unchanged.

## Non-goals

- **Options, prices and SKU codes stay in code.** Only imagery moves. Adding a
  genuinely new finish still needs a developer — a deliberate choice, since Shopify
  variants are about to own pricing and we do not want retail figures in two places.
- Not touching the illustration fallback itself.
- Not adding editorial media to `productVariant`. These images do not vary by ring
  size, so a variant is the wrong thing to hang them on — see the reasoning below.
- Not changing any other product page. Only the configurator reads this field.

## Current state

| | |
| --- | --- |
| Images | 30 files in `public/subway/`, named `{metal}-{finish}.jpg` |
| Registry | hardcoded `Set` of 30 keys in `constants.ts` |
| Resolution | `getSideImage()` — pure function, no I/O |
| Fallback | Platinum → White Gold, then the SVG illustration |
| Preload | `getAllSideImages()` returns all 30 paths, warmed on idle |
| Rendering | `SubwayRingImage` imports `getSideImage` directly |

The established Sanity pattern in this repo: Shopify-synced data sits under a
read-only `store` object on the `product` document, and editor-owned fields sit
beside it (`featureMedia`, `gallery`, `collectionMedia`). Images reach the page as
plain URLs — GROQ projects `"src": asset->url` plus dimension metadata, and
`next/image` renders them. This design follows both conventions rather than
inventing new ones.

## Design

### Schema

A new `configuratorImage` object, used in an array field on `product`:

```ts
{
  name: 'configuratorImage',
  type: 'object',
  fields: [
    { name: 'metal',  type: 'string', options: { list: METAL_OPTIONS  } },
    { name: 'finish', type: 'string', options: { list: FINISH_OPTIONS } },
    { name: 'image',  type: 'image' }
  ]
}
```

```ts
defineField({
  name: 'configuratorImages',
  title: 'Configurator Images',
  type: 'array',
  of: [{ type: 'configuratorImage' }],
  group: 'editorial'
})
```

Both option lists are **dropdowns, not free text**, and their values are the exact
strings the configurator already uses — `'Yellow Gold'`, `'Blue Sapphire'` and so on.
That matters more than it looks: a typo in a free-text key produces no image and no
error, and nobody notices until someone spots an illustration where a photograph
should be. A constrained list makes an unmatchable entry impossible to create.

The lists live in one module shared by the schema and the runtime, so they cannot
drift apart.

A `preview` shows `"{metal} — {finish}"` with the image as the thumbnail, so the
array is readable in the Studio without opening each row.

Validation: each `(metal, finish)` pair unique within the array, and all three fields
required. A duplicate pair is an editor mistake with a silent outcome — first match
wins — so it is rejected at authoring time instead.

### Query

`configuratorImages` is added to the product projection, following the gallery's
shape:

```groq
configuratorImages[]{
  metal,
  finish,
  "src": image.asset->url,
  "width": image.asset->metadata.dimensions.width,
  "height": image.asset->metadata.dimensions.height
}
```

### Resolution

`getSideImage` keeps its signature and its fallback order, but takes the fetched
images rather than closing over a hardcoded Set:

```ts
type ConfiguratorImage = { metal: string; finish: string; src: string };

export const getSideImage = (
  side: SideConfiguration,
  images: ConfiguratorImage[]
): string | undefined => {
  const match = (metal: Metal) =>
    images.find(i => i.metal === metal && i.finish === side.finish)?.src;

  return match(side.metal) ?? match(PHOTO_METAL_FALLBACK[side.metal]) ?? undefined;
};
```

Behaviour is unchanged: exact match, then the Platinum → White Gold substitution,
then `undefined`, which renders the illustration. The fallback stays in code because
it is logic, not content — and it disappears on its own the day someone uploads real
platinum photography.

### Component changes

`Details/index.tsx` already receives `sanityProductData`. It passes
`sanityProductData.configuratorImages ?? []` to `SubwayRingImage`, which passes it to
`getSideImage` and to the preload helper. `SubwayRingImage` stops importing image
data and takes it as a prop — the component becomes a pure function of its inputs,
which is also what makes it testable.

`getAllSideImages(images)` likewise takes the array and returns the `src` values to
warm on idle.

### Empty state

If `configuratorImages` is absent or empty — a product that has not been populated —
every side resolves to `undefined` and the configurator renders the illustration for
all 45 states. That is the existing fallback doing its job, not an error. No special
casing, no crash, no blank frame.

## Why metal and finish, and why that does not change

The configurator shows **one image per metal and stone/enamel combination**. It does
not show a different photograph per ring size, and it is not going to. That single
fact determines the whole shape of this field.

So an image is keyed by the two values that actually determine the picture. Not by
SKU, and not by variant id:

- A **SKU key** would need re-authoring the day Shopify variants land.
- A **variant key** would be wrong on its own terms. A variant is metal × finish ×
  size, so keying by it means storing the same photograph against nineteen variants
  to express something that does not vary by size. 45 distinct images would become
  855 rows carrying 45 pictures.

Keying by metal and finish says exactly what is true and no more.

### When Shopify variants arrive

Metal and finish become Shopify options alongside size. Resolution then reads the
selected variant's option values **by option name** and matches the same two fields,
ignoring size entirely:

```ts
const metal  = optionValue(variant, 'Metal');
const finish = optionValue(variant, 'Finish');
```

The only new code is a constant mapping Shopify's option names onto these fields,
because Shopify may name them differently — `Colour` rather than `Metal`, or
`Stone or Enamel` rather than `Finish`. That mapping is the single place the
migration touches.

**Nothing authored in Sanity changes.** The 45 entries stay as they are.

### Why not editorial media on `productVariant`

`productVariant` has no editorial fields today — only `hidden`, a title proxy and the
read-only `store` object — so adding media there would mirror how `product` works and
was the obvious first answer.

It is the wrong home for this. A variant carries size; these images do not vary by
size. Putting them there would duplicate every photograph nineteen times and make the
client maintain 855 rows to express 45 facts. If per-variant imagery is ever wanted
for some other purpose, that is a separate field with a separate reason.

### If a third axis is ever added

The array gains a field and the matcher gains a term. Nothing already authored is
invalidated.

## Files

**New**

- `tools/sanity/schema/objects/configuratorImage.ts` — the object type
- `templates/ProductTemplate/components/SubwayRingCustomizer/options.ts` — the metal
  and finish lists, shared by schema and runtime

**Changed**

- `tools/sanity/schema/documents/product.tsx` — the `configuratorImages` field
- `tools/sanity/schema/index.ts` — register the object type
- `tools/sanity/lib/queries.groq.ts` — the projection
- `.../SubwayRingCustomizer/constants.ts` — `getSideImage` and `getAllSideImages`
  take images; `AVAILABLE_SIDE_IMAGES` removed
- `.../SubwayRingCustomizer/SubwayRingImage.tsx` — images as a prop
- `.../components/Details/index.tsx` — pass the images down

## The files in `public/subway/`

They stay, for this change. Removing them is a separate step, and doing both at once
means a single mistake shows as 30 missing photographs on a page the client is
actively reviewing.

Sequence: ship this, populate the staging dataset, confirm all 45 states render from
Sanity, and only then delete the directory. Until that confirmation the files are a
working rollback — reverting one commit restores the old path.

## Dataset

Content is authored in the **staging** dataset, which already holds the product
document (`shopifyProduct-10355682017590`). The schema itself is code and applies to
whichever dataset the Studio points at, so production gets the field as soon as the
branch merges to `main` — it will simply be empty there until someone populates it.

That asymmetry is expected and harmless: an empty field falls back to the
illustration, and production has no configurator page yet.

## Testing

Because the repo has no test framework, this is verified at runtime, the same way the
configurator has been verified throughout:

- all 45 metal/finish states resolve to the expected image, matching the current
  live behaviour exactly
- Platinum still borrows white gold where platinum imagery is absent
- removing an image in Sanity makes that state fall back to the illustration
- an empty `configuratorImages` renders all 45 states as illustrations, with no error
- the preload still warms every image on idle
- prices, captions and the flip between sides are untouched

The current behaviour is the oracle: a 45-state sweep before and after must produce
the same result for every state while the imagery is unchanged.

## Rollout

1. Merge to `staging`. The field appears in the Studio; the configurator still reads
   `public/subway/` because the array is empty — no visible change.
2. Populate `configuratorImages` in the staging dataset.
3. Sweep all 45 states and compare against the pre-change capture.
4. Delete `public/subway/` in a separate commit once step 3 passes.
5. Carry to `main` whenever the configurator goes to production.

## Risks

- **The staging dataset is stale.** Its copy of this product has one placeholder
  variant rather than the nineteen ring sizes, which is what breaks add-to-cart there.
  It does not affect this work — images attach to the product document, not to
  variants — but it is the same document, so anyone re-syncing Shopify into staging
  should know the field exists and is hand-authored.
- **Thirty images is a tedious upload.** Mitigated by the dropdowns and the preview
  label making a wrong pairing obvious, and by the illustration fallback meaning a
  missed entry degrades rather than breaks.
- **Schema reaches production before content does.** Intended. An empty field is
  inert.
