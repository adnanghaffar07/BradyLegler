import { TbLayoutGrid } from 'react-icons/tb';
import defaultSectionGroups from '../../common/defaultSectionGroups';
import internalLabelField from '../../common/internalLabelField';
import ReadOnlyImageInput from '../../../components/ReadOnlyImageInput';
import { defineType } from 'sanity';
import thumbnail from '../../../../../sections/shared/DiscoverMoreSection/thumbnail.png';

interface IDiscoverMoreSection {
  title: string;
  links: {
    _ref: string;
    title: string;
    pathname: string;
    featureImage: string;
  }[];
}

const discoverMoreSection = defineType({
  name: 'discoverMoreSection',
  title: 'Discover More',
  type: 'object',
  groups: defaultSectionGroups,
  icon: TbLayoutGrid,
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
      title: 'Title',
      type: 'string',
      group: 'data'
    },
    {
      name: 'links',
      title: 'Links',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'artwork' }, { type: 'product' }, { type: 'press' }] }],
      group: 'data'
    },
    {
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
    }
  ],
  preview: {
    select: {
      internalLabel: 'internalLabel'
    },
    prepare(selection) {
      return {
        title: `Discover More`,
        subtitle: selection?.internalLabel
      };
    }
  }
});

export default discoverMoreSection;
export type { IDiscoverMoreSection };
