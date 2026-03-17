import { TbMovie } from 'react-icons/tb';
import { defineType } from 'sanity';
import defaultSectionGroups from '../../common/defaultSectionGroups';
import internalLabelField from '../../common/internalLabelField';
import ReadOnlyImageInput from '../../../components/ReadOnlyImageInput';
import thumbnail from '../../../../../sections/shared/ImageCenteredSection/thumbnail.png';
import { IButtonElement } from '../../elements/button';

interface IImageCenteredSection {
  image: SanityImage;
  addButton: boolean;
  button?: IButtonElement;
  layout: 'small' | 'medium' | 'large' | 'fullWidth';
}

const imageCenteredSection = defineType({
  name: 'imageCenteredSection',
  title: 'Image',
  type: 'object',
  groups: defaultSectionGroups,
  icon: TbMovie,
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
      name: 'layout',
      title: 'Layout',
      type: 'string',
      initialValue: 'small',
      options: {
        list: [
          { title: 'Small', value: 'small' },
          { title: 'Medium', value: 'medium' },
          { title: 'Large', value: 'large' },
          { title: 'Full Width', value: 'fullWidth' }
        ],
        layout: 'select',
        initialValue: 'small'
      },
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
      title: 'title',
      layout: 'layout',
      image: 'image',
      addButton: 'addButton'
    },
    prepare(selection) {
      const { layout = 'small', image } = selection;
      return {
        title: `Image`,
        subtitle: `${layout}`,
        media: image
      };
    }
  }
});

export default imageCenteredSection;
export type { IImageCenteredSection };
