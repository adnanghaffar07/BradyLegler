import { FiImage } from 'react-icons/fi';
import defaultSectionGroups from '../../common/defaultSectionGroups';
import internalLabelField from '../../common/internalLabelField';
import ReadOnlyImageInput from '../../../components/ReadOnlyImageInput';
import { defineType } from 'sanity';

interface IPressHeaderSection {
  image?: SanityImage;
}

const pressHeaderSection = defineType({
  name: 'pressHeaderSection',
  title: 'Press Header',
  type: 'object',
  groups: defaultSectionGroups,
  icon: FiImage,
  fields: [
    internalLabelField,
    {
      name: 'sectionPreview',
      title: 'Section Preview',
      type: 'image',
      components: { input: ReadOnlyImageInput },
      hidden: true,
      readOnly: true,
      group: 'internal'
    },
    {
      name: 'image',
      title: 'Hero Image',
      type: 'imageElementSimple',
      description: 'Full-height image displayed without cropping',
      group: 'data',
      validation: Rule => Rule.required()
    }
  ],
  preview: {
    select: {
      internalLabel: 'internalLabel'
    },
    prepare(selection) {
      return {
        title: `Press Header`,
        subtitle: selection?.internalLabel
      };
    }
  }
});

export default pressHeaderSection;
export type { IPressHeaderSection };
