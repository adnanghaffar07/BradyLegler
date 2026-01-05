'use client';

import React from 'react';
import Section from '@/components/Section';
import Layout from '@/components/Layout';
import Image from '@/components/Image';
import Link from '@/components/Link';
import styles from './styles.module.scss';

export interface ICollectionItem {
  _key?: string;
  image: {
    asset: {
      _ref: string;
      _type: 'reference';
    };
    alt?: string;
  };
  collection?: {
    store?: {
      title?: string;
      slug?: {
        current?: string;
      };
    };
  };
}

interface IHomeCollectionsSection {
  title?: string;
  items?: ICollectionItem[];
}

const HomeCollectionsSection: React.FC<IHomeCollectionsSection> = ({ title, items = [] }) => {
  const validItems = items.filter(item => {
    const store = item.collection?.store;
    return store?.title && store?.slug?.current;
  });

  if (validItems.length === 0) {
    return (
      <Section
        name="HomeCollectionsSection"
        full
        removeBottomSpacing
        removeTopSpacing
        className={styles.section}
        theme="light"
      >
        <Layout variant="fullWidth" className={styles.layout}>
          <p className={styles.noItems}>No collections available.</p>
        </Layout>
      </Section>
    );
  }

  return (
    <Section
      name="HomeCollectionsSection"
      full
      removeBottomSpacing
      removeTopSpacing
      className={styles.section}
      theme="light"
    >
      <Layout variant="fullWidth" className={styles.layout}>
        {/* {title && <h2 className={styles.title}>{title}</h2>} */}

        <div className={styles.grid}>
          {validItems.map(item => {
            const store = item.collection!.store!;
            const slug = store.slug!.current!;
            const titleText = store.title!;

            return (
              <div key={item._key} className={styles.item}>
                <div className={styles.imageWrapper}>
                  <Link href={`/${slug}`} variant="content" className={styles.link}>
                    <Image {...item.image} className={styles.img} alt={item.image?.alt || titleText} />
                  </Link>
                </div>
                <h4 className={styles.name}>{titleText}</h4>
              </div>
            );
          })}
        </div>
      </Layout>
    </Section>
  );
};

export default HomeCollectionsSection;
