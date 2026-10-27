# Sanity-managed Configurator Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the client add and replace the configurator's photography in Sanity, per metal and stone combination, instead of a developer editing a hardcoded list and committing files.

**Architecture:** A `configuratorImages` array on the `product` document, each row carrying a metal, a finish and an image. The GROQ projection flattens each to a `src` URL. `getSideImage` changes from a lookup over a hardcoded `Set` to a lookup over that fetched array, keeping its existing fallback order. `Details` passes the array down to `SubwayRingImage`.

**Tech Stack:** Next.js 14 App Router, Sanity (`next-sanity`), TypeScript, SCSS modules.

**Spec:** `docs/superpowers/specs/2026-10-27-sanity-customizer-images-design.md`

## Global Constraints

- Branch `sanity-customizer-images`, off `staging`. The configurator exists only on `staging`.
- Content is authored in the **staging** Sanity dataset. Project `79j3g10q`.
- Metal values, exactly: `Yellow Gold`, `White Gold`, `Platinum`.
- Finish values, exactly: `Plain`, `Diamond`, `Black Diamond`, `Blue Sapphire`, `Pink Sapphire`, `Emerald`, `Ruby`, `Aqua Marine`, `White Enamel`, `Black Enamel`, `Blue Enamel`, `Hot Pink Enamel`, `Teal Enamel`, `Red Enamel`, `Coral Enamel`.
- `public/subway/` is **not** deleted in this plan. It stays as a rollback until the Sanity path is confirmed.
- Options, prices and SKU rules stay in code. Imagery only.
- **This repo has no test framework** — no Jest, no Vitest, zero test files. Verification is runtime: the dev server plus a browser probe, which is how the configurator has been verified throughout. Where a step below says "write the failing check", it means a runnable probe whose output is the pass/fail signal, not a test-runner case.
- Dev server: `preview_start` with the `bradylegler-staging` config, port 3006. Never `npm run build` against a running dev server — it clobbers `.next`.
- `.next` on this machine is on OneDrive and corrupts intermittently (`EINVAL`/`EBUSY`). On a broken boot: stop the server, `rm -rf .next`, restart. Never delete `.next` while the server is running.

## Review Focus

- **An empty or absent `configuratorImages`** — a product nobody populated, or every other product on the site. Every state must render the illustration, with no crash and no blank frame. Covered in Task 4.
- **An entry whose image asset was deleted in Sanity** — `image.asset->url` resolves to null, so `src` is null. That row must be ignored rather than rendered as `<img src="null">`. Covered in Task 4.
- **A finish present in the array but absent from the code's `Finish` union** — authored before a finish was removed from code. It must be inert, not throw. Covered in Task 4.
- **Duplicate metal/finish rows** — Studio validation rejects them at authoring time, but older documents may already hold them. First match must win deterministically. Covered in Task 4.
- **Platinum fallback when platinum imagery exists** — the fallback must not override a real platinum entry. Covered in Task 4.

---

### Task 1: Shared option lists

The schema and the runtime must use the same metal and finish strings. A second hardcoded list in the schema would drift the first time a finish changes.

**Files:**
- Create: `templates/ProductTemplate/components/SubwayRingCustomizer/options.ts`
- Modify: `templates/ProductTemplate/components/SubwayRingCustomizer/constants.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `METAL_OPTIONS: readonly string[]`, `FINISH_OPTIONS: readonly string[]`, `type Metal`, `type Finish` — all from `options.ts`. Task 2 imports the two lists; `constants.ts` re-exports `METALS` and `FINISHES` from them so existing importers are untouched.

- [ ] **Step 1: Create `options.ts`**

Move the `Metal` and `Finish` type unions and the `METALS` and `FINISHES` arrays out of `constants.ts` into `options.ts`, unchanged. Add `METAL_OPTIONS` and `FINISH_OPTIONS` as plain `string[]` aliases for the Sanity dropdowns.

This file must import nothing from the component tree — the Sanity schema imports it, and pulling React into the Studio build is the failure to avoid.

- [ ] **Step 2: Re-export from `constants.ts`**

`constants.ts` imports from `./options` and re-exports `Metal`, `Finish`, `METALS`, `FINISHES` so every existing importer keeps working unchanged.

- [ ] **Step 3: Verify nothing broke**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: `237` — the repo's standing baseline. Any other number means this task introduced an error.

- [ ] **Step 4: Commit**

```bash
git add templates/ProductTemplate/components/SubwayRingCustomizer/options.ts \
        templates/ProductTemplate/components/SubwayRingCustomizer/constants.ts
git commit -m "Extract configurator option lists so the Sanity schema can share them"
```

---

### Task 2: Sanity schema

**Files:**
- Create: `tools/sanity/schema/objects/configuratorImage.ts`
- Modify: `tools/sanity/schema/documents/product.tsx`
- Modify: `tools/sanity/schema/index.ts`

**Interfaces:**
- Consumes: `METAL_OPTIONS`, `FINISH_OPTIONS` from Task 1.
- Produces: a document field `configuratorImages`, an array of `configuratorImage` objects with fields `metal: string`, `finish: string`, `image: image`. Task 3 projects it; Task 4 consumes the projected shape.

- [ ] **Step 1: Create the object type**

`defineType` named `configuratorImage`, type `object`, with:

- `metal` — `string`, `options: { list: METAL_OPTIONS }`, required
- `finish` — `string`, `options: { list: FINISH_OPTIONS }`, required
- `image` — `image`, required

Add a `preview` selecting `metal`, `finish` and `image`, preparing `title: "{metal} — {finish}"` with `media: image`, so the array is readable without opening rows.

Follow the file layout of `tools/sanity/schema/objects/gallery.ts`.

- [ ] **Step 2: Add the field to the product document**

In `tools/sanity/schema/documents/product.tsx`, after the `gallery` field, add:

```ts
defineField({
  name: 'configuratorImages',
  title: 'Configurator Images',
  description: 'For customizable products: one image per metal and stone combination.',
  type: 'array',
  of: [{ type: 'configuratorImage' }],
  group: 'editorial',
  validation: Rule =>
    Rule.custom((rows?: { metal?: string; finish?: string }[]) => {
      const seen = new Set<string>();
      for (const row of rows ?? []) {
        const key = `${row?.metal}|${row?.finish}`;
        if (seen.has(key)) return `Duplicate combination: ${row?.metal} / ${row?.finish}`;
        seen.add(key);
      }
      return true;
    })
})
```

The duplicate check exists because a duplicate is an editor mistake with a silent outcome — first match wins and the second row is invisible.

- [ ] **Step 3: Register the object type**

In `tools/sanity/schema/index.ts`, import `configuratorImage` and add it to the exported schema array, following how `gallery` is registered.

- [ ] **Step 4: Verify the Studio renders the field**

Start the dev server, open `http://localhost:3006/studio`, open the Subway Double Band Ring product, and confirm under the Editorial group: a **Configurator Images** array; adding a row offers metal and finish as dropdowns with the exact values from Global Constraints and no free-text entry.

Expected: field present, both dropdowns populated, image picker present.

- [ ] **Step 5: Verify the duplicate rule fires**

In the Studio, add two rows with the same metal and finish.

Expected: a validation error naming the duplicated combination; the document cannot be published.

- [ ] **Step 6: Commit**

```bash
git add tools/sanity/schema/objects/configuratorImage.ts \
        tools/sanity/schema/documents/product.tsx \
        tools/sanity/schema/index.ts
git commit -m "Add configuratorImages field to the product document"
```

---

### Task 3: GROQ projection

**Files:**
- Modify: `tools/sanity/projections/documents/product.groq.ts`

**Interfaces:**
- Consumes: the `configuratorImages` field from Task 2.
- Produces: on the fetched product, `configuratorImages: { metal: string; finish: string; src: string | null }[]`. Task 4 consumes exactly this shape.

- [ ] **Step 1: Add the projection**

In `productProjection`, after the `gallery[]{...}` block:

```groq
configuratorImages[]{
  metal,
  finish,
  "src": image.asset->url
},
```

Projected flat as a URL rather than reusing `imageProjection`, because the consumer needs a string for an `<img src>`, not an asset object. `src` is `null` when the asset has been deleted — Task 4 handles that.

The spec's draft projection also carried `width` and `height` from the asset metadata. They are omitted deliberately: `SubwayRingImage` renders a plain `<img>` sized entirely by CSS (`aspect-ratio: 1 / 1`, `object-fit: cover`), not `next/image`, so nothing reads them.

- [ ] **Step 2: Verify the field comes back**

With at least one row authored in the staging dataset, run:

```bash
curl -s -G "https://79j3g10q.apicdn.sanity.io/v2021-10-21/data/query/staging" \
  --data-urlencode 'query=*[_type=="product"&&store.slug.current=="subway-double-band-ring-yellow-gold"][0]{configuratorImages[]{metal,finish,"src":image.asset->url}}'
```

Expected: a `configuratorImages` array whose rows each carry `metal`, `finish` and an `https://cdn.sanity.io/...` `src`.

- [ ] **Step 3: Commit**

```bash
git add tools/sanity/projections/documents/product.groq.ts
git commit -m "Project configuratorImages onto the product"
```

---

### Task 4: Resolve images from the fetched array

The signature change and the component change land together — the build does not compile between them.

**Files:**
- Modify: `templates/ProductTemplate/components/SubwayRingCustomizer/constants.ts`
- Modify: `templates/ProductTemplate/components/SubwayRingCustomizer/SubwayRingImage.tsx`
- Modify: `templates/ProductTemplate/components/Details/index.tsx`

**Interfaces:**
- Consumes: the projected shape from Task 3.
- Produces:
  - `type ConfiguratorImage = { metal: string; finish: string; src: string | null }`
  - `getSideImage(side: SideConfiguration, images: ConfiguratorImage[]): string | undefined`
  - `getAllSideImages(images: ConfiguratorImage[]): string[]`
  - `SubwayRingImageProps` gains `images: ConfiguratorImage[]`

- [ ] **Step 1: Capture the current behaviour as the baseline**

Before changing anything, with the dev server on the unmodified branch, sweep all 45 metal/finish states and record the filename rendered for Side One in each. Save to `/tmp/baseline-45.json`.

This is the oracle for Step 7. The configurator's current output is the specification of correct behaviour.

- [ ] **Step 2: Write the failing checks**

A probe, runnable in the browser console against the dev server, asserting:

| Check | Expectation |
| --- | --- |
| all 45 states | every state resolves to the same image as the baseline |
| empty array | all 45 states render the illustration, no console error |
| `src: null` row | that state renders the illustration, never `<img src="null">` |
| unknown finish in the array | ignored, no throw |
| duplicate rows | first match wins, deterministically |
| platinum entry present | used in preference to the white-gold fallback |

- [ ] **Step 3: Run the probe to verify it fails**

Expected: FAIL — `getSideImage` does not yet accept an `images` argument.

- [ ] **Step 4: Change the resolution functions in `constants.ts`**

Replace `AVAILABLE_SIDE_IMAGES` and the two helpers with:

```ts
export type ConfiguratorImage = { metal: string; finish: string; src: string | null };

export const getSideImage = (
  side: SideConfiguration,
  images: ConfiguratorImage[]
): string | undefined => { /* … */ };

export const getAllSideImages = (images: ConfiguratorImage[]): string[] => { /* … */ };
```

`getSideImage` keeps today's order: exact metal and finish match, then `PHOTO_METAL_FALLBACK` for the metal, then `undefined`. Rows whose `src` is falsy are skipped at every stage, which is what makes a deleted asset fall back rather than render an empty `img`. `getAllSideImages` returns the non-null `src` values for preloading.

Delete `AVAILABLE_SIDE_IMAGES` and `buildSideImageKey` — nothing else uses them. Keep `PHOTO_METAL_FALLBACK`; it is logic, not content.

- [ ] **Step 5: Thread the images through the components**

`SubwayRingImageProps` gains `images: ConfiguratorImage[]`. The component passes it to both helpers instead of importing data. `Details/index.tsx` passes `sanityProductData?.configuratorImages ?? []`.

- [ ] **Step 6: Verify the type baseline**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: `237`.

- [ ] **Step 7: Run the probe to verify it passes**

Expected: PASS on all six checks, including all 45 states matching `/tmp/baseline-45.json` exactly.

- [ ] **Step 8: Commit**

```bash
git add templates/ProductTemplate/components/SubwayRingCustomizer/constants.ts \
        templates/ProductTemplate/components/SubwayRingCustomizer/SubwayRingImage.tsx \
        templates/ProductTemplate/components/Details/index.tsx
git commit -m "Resolve configurator images from Sanity instead of a hardcoded list"
```

---

### Task 5: Populate the staging dataset

Code is done; this proves it end to end against real content. A write token is present in `.env` as `SANITY_WRITE_TOKEN`, so the upload can be scripted rather than done by hand 30 times.

**Files:**
- Create: `scripts-scratch/upload-configurator-images.mjs` (throwaway; not shipped)

**Interfaces:**
- Consumes: `getSideImage` behaviour from Task 4; the 30 files in `public/subway/`.
- Produces: a populated `configuratorImages` array on the staging product document.

- [ ] **Step 1: Write the upload script**

For each of the 30 files in `public/subway/`, derive metal and finish from the filename (`{metal-slug}-{finish-slug}.jpg`), upload the asset to the **staging** dataset, and patch the product document's `configuratorImages` with one row per file.

Must be idempotent — re-running replaces the array rather than appending, so a half-finished run can simply be repeated.

- [ ] **Step 2: Run it against staging**

Run the script. Expected: 30 assets uploaded, 30 rows written, no errors.

- [ ] **Step 3: Verify in the Studio**

Open the product. Expected: 30 rows, each labelled `"{metal} — {finish}"` with a visible thumbnail, no validation errors.

- [ ] **Step 4: Verify the rendered page matches the baseline**

Sweep all 45 states against `/tmp/baseline-45.json`.

Expected: every state identical to the baseline, now served from `cdn.sanity.io` rather than `/subway/`. Confirm the hostname changed — that is the proof the new path is actually in use.

- [ ] **Step 5: Verify the editor loop**

Remove one row in the Studio and reload the page.

Expected: that single state falls back to the illustration; the other 44 are unaffected. Restore the row afterwards.

- [ ] **Step 6: Commit**

```bash
git add scripts-scratch/upload-configurator-images.mjs
git commit -m "Add throwaway script that seeds configurator images into staging"
```

---

## Not in this plan

- **Deleting `public/subway/`.** A separate commit after Task 5 passes, so there is a one-commit rollback while the Sanity path is new.
- **Carrying to `main`.** The configurator is not on production.
- **Moving the option lists into Sanity.** Only needed if a second customizable product wants different metals or stones.
