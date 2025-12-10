import { FiStar } from 'react-icons/fi';
import defaultSectionGroups from '../../common/defaultSectionGroups';
import internalLabelField from '../../common/internalLabelField';
import ReadOnlyImageInput from '../../../components/ReadOnlyImageInput';
import { defineType } from 'sanity';
import thumbnail from '../../../../../sections/shared/HeaderHeroSection/thumbnail.png';
import { IButtonElement } from '../../elements/button';

interface IHeaderHeroSection {
  tagline?: string;
  title?: string;
  content?: SanityTextBlock[];
  addButton?: boolean;
  button?: IButtonElement;
  image: SanityImage;
}

const headerHeroSection = defineType({
  name: 'headerHeroSection',
  title: 'Hero Header',
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
      name: 'tagline', // ADD THIS FIELD
      title: 'Tagline',
      type: 'string',
      description: 'Short text displayed above the button',
      group: 'data' // Assuming you want it in the data group
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
    }
  ],
  preview: {
    select: {
      internalLabel: 'internalLabel',
      title: 'title'
    },
    prepare(selection) {
      return {
        title: `Header - Hero`,
        subtitle: selection?.internalLabel
      };
    }
  }
});

export default headerHeroSection;
export type { IHeaderHeroSection };
