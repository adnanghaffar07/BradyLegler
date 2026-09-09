'use client';

import Text from '@/components/Text';
import { useEffect, useState } from 'react';
import SizeGuide from '../SizeGuide';
import { ISizeGuideDocument } from '@/tools/sanity/schema/documents/sizeGuideDocument';
import styles from './styles.module.scss';

// Boilerplate Shopify carries on every product description. The client asked for it
// off the storefront; it still lives on the products in Shopify, so it is filtered
// here at render time rather than edited away per product.
const SUPPRESSED_DESCRIPTION_PHRASES = ['handcrafted and inherently unique'];

/**
 * Drop any paragraph containing one of the suppressed phrases. Splitting on the
 * closing tag keeps the remaining markup intact: the trailing empty segment means
 * the last surviving paragraph still gets its </p> back on join.
 */
const stripSuppressedParagraphs = (html: string) => {
  const isSuppressed = (chunk: string) =>
    SUPPRESSED_DESCRIPTION_PHRASES.some(phrase => chunk.toLowerCase().includes(phrase.toLowerCase()));

  return html
    .split('</p>')
    .filter(chunk => !isSuppressed(chunk))
    .join('</p>');
};

const Description = ({
  descriptionHtml,
  sanitySizeGuide,
  collections,
  sizeGuideOpen,
  onSizeGuideOpenChange
}: {
  descriptionHtml?: string;
  sanitySizeGuide: ISizeGuideDocument;
  collections?: any;
  sizeGuideOpen?: boolean;
  onSizeGuideOpenChange?: (open: boolean) => void;
}) => {
  const [description, setDescription] = useState<string | null>(null);

  useEffect(() => {
    if (!descriptionHtml) return;

    // Validate: Check if descriptionHtml contains CSS module classes (invalid data)
    if (descriptionHtml.includes('styles_') || descriptionHtml.includes('class="styles')) {
      setDescription(null);
      return;
    }

    const rawDescriptionSplit = descriptionHtml.split('~section~');
    let cleanedDescription = rawDescriptionSplit[0] ?? null;
    
    // Remove any inline text-align styles that might be coming from Shopify
    if (cleanedDescription) {
      cleanedDescription = stripSuppressedParagraphs(cleanedDescription)
        // Remove all text-align styles
        .replace(/text-align:\s*[^;]+;?/gi, '')
        // Remove align attributes
        .replace(/align=["'][^"']*["']/gi, '')
        // Remove empty style attributes
        .replace(/style=["']\s*["']/g, '');
    }
    
    // Products whose description was only the suppressed boilerplate end up empty,
    // so fall back to null rather than rendering a blank block.
    setDescription(cleanedDescription?.trim() || null);
  }, [descriptionHtml]);

  return (
    <div className={styles.container}>
      <SizeGuide
        sanitySizeGuide={sanitySizeGuide}
        collections={collections}
        isOpen={sizeGuideOpen}
        onOpenChange={onSizeGuideOpenChange}
      />

      {description && (
        <div className={styles.description}>
          <span dangerouslySetInnerHTML={{ __html: description }} />
        </div>
      )}
    </div>
  );
};

export default Description;
