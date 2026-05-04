import type { SanityDocument } from 'next-sanity';

/** Meta description for Sanity `page` documents when `seoData.seoDescription` is empty. */
export const getPageSeoDescriptionFallback = (title?: string | null): string => {
  const t = title?.trim();
  if (!t) return '';
  return `${t} — explore this Brady Legler page for details, story, and collections.`;
};

/**
 * Per-document meta description when Sanity `seoData.seoDescription` is empty.
 * Keeps URLs from all inheriting the global default from config/metadata.
 */
const getSanityDocumentMetaDescription = (document: SanityDocument | null): string => {
  if (!document) return '';

  const title =
    document._type === 'page'
      ? (document as any)?.page?.title
      : document._type === 'artwork'
        ? (document as any)?.artwork?.title
        : document._type === 'press'
          ? (document as any)?.press?.title
          : document._type === 'product'
            ? (document as any)?.product?.store?.title
            : document._type === 'collection'
              ? (document as any)?.collection?.store?.title
              : undefined;

  if (!title) return '';

  switch (document._type) {
    case 'page':
      return getPageSeoDescriptionFallback(title);
    case 'artwork':
      return `${title} by Brady Legler — an original painting made with emotion, color, and craft.`;
    case 'press':
      return `Press coverage for ${title} — learn more about Brady Legler's work and story.`;
    case 'product':
      return `${title} by Brady Legler — luxury fine jewelry rooted in story, design, and craft.`;
    case 'collection':
      return `${title} collection by Brady Legler — discover pieces made to be felt as much as worn.`;
    default:
      return '';
  }
};

export default getSanityDocumentMetaDescription;
