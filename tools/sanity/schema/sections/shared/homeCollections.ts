import { defineType, defineField } from 'sanity';
import { FiGrid } from 'react-icons/fi';
import defaultSectionGroups from '../../common/defaultSectionGroups';
import internalLabelField from '../../common/internalLabelField';
import ReadOnlyImageInput from '../../../components/ReadOnlyImageInput';
import thumbnail from '../../../../../sections/shared/CollectionRow/thumbnail.png';

interface IHomeCollectionsSection {
  title?: string;
  products: any[];
}

export const homeCollections = defineType({
  name: 'homeCollections',
  title: 'Home Collections Section',
  type: 'object',
  groups: defaultSectionGroups,
  icon: FiGrid,
  fields: [
    internalLabelField,
    {
      name: 'sectionPreview',
      title: 'Section Preview',
      type: 'image',
      components: { input: ReadOnlyImageInput },
      // @ts-ignore
      imageUrl: thumbnail.src,
      readOnly: true,
      group: 'internal'
    },
    {
      name: 'title',
      title: 'Section Title',
      type: 'string',
      group: 'data'
    },
    defineField({
      name: 'products',
      title: 'Products',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'product' }],
          options: { filter: `store.status != 'archived'` }
        }
      ],
      group: 'data'
    }),
    defineField({
      name: 'sectionFields',
      title: 'Section Fields',
      type: 'object',
      group: 'styles',
      fields: [
        {
          name: 'gridPosition',
          title: 'Grid Position',
          description: 'Position within the product grid. Top: 25% of products, Middle: 50% of products, Bottom: 75% of products',
          type: 'string',
          options: {
            list: [
              { title: 'Top (25% of products)', value: 'top' },
              { title: 'Middle (50% of products)', value: 'middle' },
              { title: 'Bottom (75% of products)', value: 'bottom' }
            ],
            layout: 'radio',
            direction: 'horizontal'
          },
          initialValue: 'middle'
        }
      ]
    })
  ],
  preview: {
    select: {
      title: 'title',
      productCount: 'products',
      internalLabel: 'internalLabel'
    },
    prepare({ title, productCount, internalLabel }) {
      return {
        title: 'Home Collections',
        subtitle: internalLabel || `${title || 'Untitled'} - ${productCount ? productCount.length : 0} products`
      };
    }
  }
});

export type { IHomeCollectionsSection };
