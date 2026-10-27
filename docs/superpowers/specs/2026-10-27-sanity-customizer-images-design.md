# Customizer images from Sanity

**Date:** 2026-10-27
**Branch:** `sanity-customizer-images` (from `staging`)
**Dataset:** `staging`
**Status:** awaiting review

## What this does

Open a product in Sanity. If it is a customizable product — one offered in several
metals and stones — there is a field where you add an image for each combination.
Add as many as that product needs: four, five, forty-five.

The configurator shows those images. That is the whole change.

## Why

The photographs currently live in `public/subway/` and are listed in a hardcoded Set
in `constants.ts`. Swapping one means a developer renames a file, edits the Set and
ships a commit. The client has sent three batches of imagery in the past fortnight;
every one needed a developer.

## Scope

Imagery only. The list of metals and finishes, the prices and the SKU rules stay in
code. Adding a genuinely new stone still needs a developer — Shopify variants are
about to own pricing, and we do not want retail figures in two places.

## Design

### Schema

A `configuratorImage` object, used in an array on the `product` document:

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
  description: 'For customizable products: one image per metal and stone combination.',
  type: 'array',
  of: [{ type: 'configuratorImage' }],
  group: 'editorial'
})
```

The field sits beside `gallery` and `featureMedia`, in the same editorial group, so it
is where an editor already looks for a product's imagery.

It appears on every product. Products that are not customizable simply leave it empty —
no flag to maintain, nothing to keep in sync.

**Metal and finish are dropdowns, not free text.** Their values are the exact strings
the configurator uses. This matters: a mistyped key produces no image *and no error* —
the state silently falls back to the generated illustration, and nobody notices until
someone spots a drawing where a photograph should be. A constrained list makes an
unmatchable entry impossible to author.

A `preview` shows `"{metal} — {finish}"` with the image as its thumbnail, so the array
is readable without opening each row.

Validation: all three fields required, and each metal/finish pair unique within the
array. A duplicate is an editor mistake with a silent outcome — first match wins — so
it is rejected at authoring time.

### Query

Added to the product projection, following the gallery's existing shape:

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

`getSideImage` keeps its signature and fallback order, but reads the fetched images
instead of a hardcoded Set:

```ts
export const getSideImage = (
  side: SideConfiguration,
  images: ConfiguratorImage[]
): string | undefined => {
  const match = (metal: Metal) =>
    images.find(i => i.metal === metal && i.finish === side.finish)?.src;

  return match(side.metal) ?? match(PHOTO_METAL_FALLBACK[side.metal]) ?? undefined;
};
```

Behaviour is unchanged: exact match, then Platinum borrowing white gold, then
`undefined`, which renders the illustration. That fallback stays in code because it is
logic, not content, and it stops mattering the day someone uploads platinum imagery.

### Components

`Details/index.tsx` already receives `sanityProductData`; it passes
`configuratorImages ?? []` down. `SubwayRingImage` takes the images as a prop instead
of importing them, and passes them to `getSideImage` and to the preload helper. The
component becomes a pure function of its inputs.

### Empty field

Every side resolves to `undefined` and the configurator renders illustrations. That is
the existing fallback working, not an error — no special casing, no blank frame.

## Keying

An image is determined by the metal and the stone. It does not vary by ring size, so it
is keyed by those two values and nothing else.

Not by SKU, which would need re-authoring when Shopify variants land. Not by variant,
because a variant carries size — keying by it would store the same photograph against
every size of the same combination.

When metal and finish become Shopify options, resolution reads the selected variant's
option values by name and ignores size. The only new code is a constant mapping
Shopify's option names onto these two fields, in case they are called `Colour` or
`Stone or Enamel`. Nothing authored in Sanity changes.

## Files

**New**

- `tools/sanity/schema/objects/configuratorImage.ts`
- `.../SubwayRingCustomizer/options.ts` — the metal and finish lists, shared by the
  schema and the runtime so they cannot drift apart

**Changed**

- `tools/sanity/schema/documents/product.tsx` — the field
- `tools/sanity/schema/index.ts` — register the object
- `tools/sanity/lib/queries.groq.ts` — the projection
- `.../SubwayRingCustomizer/constants.ts` — `getSideImage` and `getAllSideImages` take
  images; the hardcoded Set is removed
- `.../SubwayRingCustomizer/SubwayRingImage.tsx` — images as a prop
- `.../components/Details/index.tsx` — pass them down

## The files in `public/subway/`

They stay, for this change. Deleting them at the same time means one mistake shows as
thirty missing photographs on a page the client is actively reviewing.

Ship this, populate the staging dataset, confirm every state renders from Sanity, then
delete the directory in a separate commit. Until that confirmation those files are a
one-commit rollback.

## Dataset

Content is authored in the **staging** dataset, which already holds the product
document (`shopifyProduct-10355682017590`). The schema is code, so production gets the
field when the branch reaches `main` — empty, and therefore inert.

## Testing

No test framework in this repo, so this is verified at runtime, as the configurator has
been throughout. The current behaviour is the oracle: a sweep of all 45 states before
and after must match while the imagery is unchanged.

- every metal/finish state resolves to the expected image
- Platinum still borrows white gold where platinum imagery is absent
- removing an image in Sanity falls that state back to the illustration
- an empty field renders every state as an illustration, with no error
- preloading still warms every image on idle
- prices, captions and the side flip are untouched

## Rollout

1. Merge to `staging`. The field appears; the array is empty, so nothing changes on
   screen.
2. Populate it in the staging dataset.
3. Sweep all 45 states against the pre-change capture.
4. Delete `public/subway/` in a separate commit.
5. Carry to `main` when the configurator goes to production.

## Risks

- **Thirty images is a tedious upload.** Mitigated by the dropdowns and the preview
  label making a wrong pairing visible, and by a missed entry degrading to the
  illustration rather than breaking the page.
- **Only one product is customizable today**, and its option list lives in code. If a
  second customizable product ever needs a different set of metals or stones, that list
  has to move to Sanity too — a separate change, deliberately not done here.
