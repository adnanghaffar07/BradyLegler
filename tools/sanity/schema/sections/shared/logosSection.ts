import { TbDots } from 'react-icons/tb';
import defaultSectionGroups from '../../common/defaultSectionGroups';
import internalLabelField from '../../common/internalLabelField';
import ReadOnlyImageInput from '../../../components/ReadOnlyImageInput';
import stripTitleTags from '../../../helpers/stripTitleTags';
import { defineType } from 'sanity';
import thumbnail from '../../../../../sections/shared/LogosSection/thumbnail.png';

interface ILogosSection {
  useGlobalComponent: boolean;
  globalComponent?: any;
  title: string;
  images: SanityImage[];
}

const logosSection = defineType({
  name: 'logosSection',
  title: 'Logos',
  type: 'object',
  groups: defaultSectionGroups,
  icon: TbDots,
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
      name: 'useGlobalComponent',
      title: 'Use global component?',
      type: 'boolean',
      initialValue: false,
      description: `Choose whether to use a global component instead of building a local component.`,
      group: 'data',
      hidden: ({ document }) => document?._type === 'globalLogos'
    },
    {
      name: 'globalComponent',
      title: 'Global Component',
      type: 'reference',
      to: [{ type: 'globalLogos' }],
      group: 'data',
      hidden: ({ parent }) => parent?.useGlobalComponent !== true
    },
    {
      name: 'title',
      title: 'Title',
      type: 'title',
      group: 'data'
    },
    {
      name: 'images',
      title: 'Logo Images',
      description: "Will default to Global Fields' logos if left empty.",
      type: 'array',
      of: [{ type: 'imageElementSimple' }],
      group: 'data'
    },
  ],
  preview: {
    select: {
      internalLabel: 'internalLabel',
      title: 'title'
    },
    prepare(selection) {
      return {
        title: `Logos`,
        subtitle: selection?.internalLabel || stripTitleTags(selection?.title)
      };
    }
  }
});

export default logosSection;
export type { ILogosSection };
