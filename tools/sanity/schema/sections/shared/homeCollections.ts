// In homeCollections.ts
import { defineType } from 'sanity';
import { FiGrid } from 'react-icons/fi';

export const homeCollections = defineType({
  name: 'homeCollections',
  title: 'Home Products Section',
  type: 'document',
  icon: FiGrid,
  fields: [
    {
      name: 'title',
      title: 'Section Title',
      type: 'string'
    },
    {
      name: 'products',
      title: 'Products',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'product' }]
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'title',
      productCount: 'products'
    },
    prepare({ title, productCount }) {
      return {
        title: title || 'Home Products',
        subtitle: `${productCount ? productCount.length : 0} products`
      };
    }
  }
});

// Remove collectionItem if not needed
// export const collectionItem = defineType({ ... });
