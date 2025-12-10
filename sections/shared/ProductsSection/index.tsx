'use client';

import React from 'react';
import Section from '@/components/Section';
import { IProductsSection } from '@/tools/sanity/schema/sections/shared/productsSection';
import Text from '@/components/Text';
import ProductCard from '@/components/ProductCard';
import styles from './styles.module.scss';

const ProductsSection: React.FC<IProductsSection> = props => {
  const { title, products } = props;
  return (
    <Section name="ProductsSection" className={styles.section} containerClassName={styles.container}>
      <Text as="h2" text={title} variant="heading" size="md" className={styles.sectionTitle} />
      {products && products.length > 0 && (
        <div className={styles.products}>
          {products.map(product => {
            return <ProductCard key={product._id} sanityProduct={product.store} />;
          })}
        </div>
      )}
    </Section>
  );
};

export default ProductsSection;
