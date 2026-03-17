import { FiStar } from 'react-icons/fi';
import defaultSectionGroups from '../../common/defaultSectionGroups';
import internalLabelField from '../../common/internalLabelField';
import ReadOnlyImageInput from '../../../components/ReadOnlyImageInput';
import { defineType, defineField } from 'sanity';
import thumbnail from '../../../../../sections/shared/QuoteSection/thumbnail.png';

export interface IQuoteSection {
  content: SanityTextBlock[];
  image?: SanityImage;
  className?: string;
  theme: 'light' | 'dark';
}

const quoteSection = defineType({
  name: 'quoteSection',
  title: 'Quote',
  type: 'object',
  groups: defaultSectionGroups,
  icon: FiStar,
  fields: [
    internalLabelField,
    defineField({
      name: 'sectionPreview',
      title: 'Section Preview',
      type: 'image',
      components: { input: ReadOnlyImageInput },
      // @ts-ignore
      imageUrl: thumbnail.src,
      readOnly: true,
      group: 'internal'
    }),
    defineField({
      name: `content`,
      title: `Content`,
      type: `blockContentSimple`,
      group: 'data'
    }),
    defineField({
      name: 'image',
      title: 'Image',
      description: 'Add an optional image to display above the quote',
      type: 'image',
      group: 'data'
    }),
    defineField({
      name: `theme`,
      title: `Theme`,
      type: `string`,
      options: {
        list: [
          { title: 'Default', value: 'light' },
          { title: 'Dark', value: 'dark' }
        ]
      },
      initialValue: 'light',
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
      internalLabel: 'internalLabel',
      title: 'title'
    },
    prepare(selection) {
      return {
        title: `Quote`,
        subtitle: selection?.internalLabel
      };
    }
  }
});

export default quoteSection;
