import { TbColumns2 } from 'react-icons/tb';
import defaultSectionGroups from '../../common/defaultSectionGroups';
import internalLabelField from '../../common/internalLabelField';
import ReadOnlyImageInput from '../../../components/ReadOnlyImageInput';
import { defineType } from 'sanity';
import thumbnail from '../../../../../sections/shared/TwoColumnMediaSection/thumbnail.png';
import { IButtonElement } from '../../elements/button';

interface ITwoColumnMediaSection {
  imageSideA: SanityImage;
  addButtonSideA: boolean;
  buttonSideA?: IButtonElement;
  taglineSideA?: string; // ADD THIS
  imageSideB: SanityImage;
  addButtonSideB: boolean;
  buttonSideB?: IButtonElement;
  taglineSideB?: string; // ADD THIS
  invertLayout: boolean;
  className?: string;
}

const twoColMediaSection = defineType({
  name: 'twoColMediaSection',
  title: 'Two Column - Media',
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
      name: `imageSideA`,
      title: `Side A - Image`,
      type: `imageElementSimple`,
      group: 'data'
    },
    {
      name: `addButtonSideA`,
      title: `Side A - Add Button`,
      type: `boolean`,
      group: 'data',
      initialValue: false
    },
    {
      name: `taglineSideA`, // ADD THIS FIELD
      title: `Side A - Tagline`,
      type: `string`,
      description: 'Short tagline or text to display above the button',
      group: 'data',
      hidden: ({ parent }) => !parent?.addButtonSideA
    },
    {
      name: `buttonSideA`,
      title: `Side A - Button`,
      type: `buttonElement`,
      group: 'data',
      hidden: ({ parent }) => !parent?.addButtonSideA
    },
    {
      name: `imageSideB`,
      title: `Side B - Image`,
      type: `imageElementSimple`,
      group: 'data'
    },
    {
      name: `addButtonSideB`,
      title: `Side B - Add Button`,
      type: `boolean`,
      group: 'data',
      initialValue: false
    },
    {
      name: `taglineSideB`, // ADD THIS FIELD
      title: `Side B - Tagline`,
      type: `string`,
      description: 'Short tagline or text to display above the button',
      group: 'data',
      hidden: ({ parent }) => !parent?.addButtonSideB
    },
    {
      name: `buttonSideB`,
      title: `Side B - Button`,
      type: `buttonElement`,
      group: 'data',
      hidden: ({ parent }) => !parent?.addButtonSideB
    },
    {
      name: `invertLayout`,
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
        title: `Two Column - Media`,
        subtitle: selection?.internalLabel
      };
    }
  }
});

export { twoColMediaSection };
export type { ITwoColumnMediaSection };