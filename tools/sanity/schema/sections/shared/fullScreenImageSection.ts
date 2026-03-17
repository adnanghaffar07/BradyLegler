import { FiStar } from 'react-icons/fi';
import defaultSectionGroups from '../../common/defaultSectionGroups';
import internalLabelField from '../../common/internalLabelField';
import ReadOnlyImageInput from '../../../components/ReadOnlyImageInput';
import { defineType } from 'sanity';
import thumbnail from '../../../../../sections/shared/FullscreenImageSection/thumbnail.png';
import { IButtonElement } from '../../elements/button';

interface IFullscreenImageSection {
  tagline?: string;
  title?: string;
  content?: SanityTextBlock[];
  addButton?: boolean;
  button?: IButtonElement;
  image: SanityImage;
}

const fullscreenImageSection = defineType({
  name: 'fullscreenImageSection',
  title: 'Fullscreen Image Section',
  type: 'object',
  groups: defaultSectionGroups,
  icon: FiStar,
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
      name: `image`,
      title: `Image`,
      type: `imageElementSimple`,
      group: 'data'
    },
    {
      name: `addButton`,
      title: `Add Button`,
      type: `boolean`,
      group: 'data'
    },
    {
      name: `button`,
      title: `Button`,
      type: `buttonElement`,
      group: 'data',
      hidden: ({ parent }) => !parent?.addButton
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
      internalLabel: 'internalLabel',
      title: 'title'
    },
    prepare(selection) {
      return {
        title: `Fullscreen Image Section`,
        subtitle: selection?.internalLabel
      };
    }
  }
});

export default fullscreenImageSection;
export type { IFullscreenImageSection };
