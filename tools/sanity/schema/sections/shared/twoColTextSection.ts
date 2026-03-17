import { TbColumns2 } from 'react-icons/tb';
import defaultSectionGroups from '../../common/defaultSectionGroups';
import internalLabelField from '../../common/internalLabelField';
import ReadOnlyImageInput from '../../../components/ReadOnlyImageInput';
import { defineType } from 'sanity';
import thumbnail from '../../../../../sections/shared/TwoColumnTextSection/thumbnail.png';

interface ITwoColumnTextSection {
  contentSideA: SanityTextBlock[];
  contentSideB: SanityTextBlock[];
}

const twoColTextSection = defineType({
  name: 'twoColTextSection',
  title: 'Two Column - Text',
  type: 'object',
  groups: defaultSectionGroups,
  icon: TbColumns2,
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
      name: `contentSideA`,
      title: `Content - Side A`,
      type: 'blockContentStandard',
      group: 'data'
    },
    {
      name: `contentSideB`,
      title: `Content - Side B`,
      type: 'blockContentStandard',
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
        title: `Two Column - Text`,
        subtitle: selection?.internalLabel
      };
    }
  }
});

export default twoColTextSection;
export type { ITwoColumnTextSection };
