'use client';

import Text from '@/components/Text';
import { useEffect, useState } from 'react';
import SizeGuide from '../SizeGuide';
import { ISizeGuideDocument } from '@/tools/sanity/schema/documents/sizeGuideDocument';
import styles from './styles.module.scss';

const Description = ({
  descriptionHtml,
  sanitySizeGuide,
  collections
}: {
  descriptionHtml?: string;
  sanitySizeGuide: ISizeGuideDocument;
  collections?: any;
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
      cleanedDescription = cleanedDescription
        // Remove all text-align styles
        .replace(/text-align:\s*[^;]+;?/gi, '')
        // Remove align attributes
        .replace(/align=["'][^"']*["']/gi, '')
        // Remove empty style attributes
        .replace(/style=["']\s*["']/g, '');
    }
    
    setDescription(cleanedDescription);
  }, [descriptionHtml]);

  return (
    <div className={styles.container}>
      <SizeGuide sanitySizeGuide={sanitySizeGuide} collections={collections} />

      {description && (
        <div className={styles.description}>
          <span dangerouslySetInnerHTML={{ __html: description }} />
        </div>
      )}
    </div>
  );
};

export default Description;
