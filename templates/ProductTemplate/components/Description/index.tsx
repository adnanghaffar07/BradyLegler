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

    const rawDescriptionSplit = descriptionHtml.split('~section~');
    setDescription(rawDescriptionSplit[0] ?? null);
  }, [descriptionHtml]);

  return (
    <div className={styles.container}>
            <SizeGuide sanitySizeGuide={sanitySizeGuide} collections={collections} />

      {description && (
        <p className={styles.description} as="p" size="b3">
          <span dangerouslySetInnerHTML={{ __html: description }} />
        </p>
      )}

    </div>
  );
};

export default Description;
