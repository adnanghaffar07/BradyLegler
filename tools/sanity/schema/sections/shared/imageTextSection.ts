import { TbColumns2 } from 'react-icons/tb';
import defaultSectionGroups from '../../common/defaultSectionGroups';
import internalLabelField from '../../common/internalLabelField';
import ReadOnlyImageInput from '../../../components/ReadOnlyImageInput';
import { defineType } from 'sanity';
import thumbnail from '../../../../../sections/shared/ImageTextSection/thumbnail.png';

const imageTextSection = defineType({
  name: 'imageTextSection',
  title: 'Image + Text',
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
      name: 'image',
      title: 'Image',
      type: 'imageElementSimple',
      group: 'data'
    },
    {
      name: 'textBlock',
      title: 'Text Block',
      type: 'blockContentStandard',
      group: 'data'
    },
    {
      name: 'addButton',
      title: 'Add Button',
      type: 'boolean',
      group: 'data',
      initialValue: false
    },
    {
      name: 'button',
      title: 'Button',
      type: 'buttonElement',
      group: 'data',
      hidden: ({ parent }) => !parent?.addButton
    },
    {
      name: 'invertLayout',
      title: 'Invert Layout',
      type: 'boolean',
      group: 'styles',
      initialValue: false
    }
  ],
  preview: {
    select: {
      internalLabel: 'internalLabel'
    },
    prepare(selection) {
      return {
        title: `Image + Text`,
        subtitle: selection?.internalLabel
      };
    }
  }
});

export { imageTextSection };
