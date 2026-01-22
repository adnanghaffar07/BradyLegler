import { TbArrowsVertical } from 'react-icons/tb';
import defaultSectionGroups from '../../common/defaultSectionGroups';
import internalLabelField from '../../common/internalLabelField';
import ReadOnlyImageInput from '../../../components/ReadOnlyImageInput';
import { defineType } from 'sanity';

export interface ISpacerSection {
  height?: number;
  mobileHeight?: number;
  useSeparateMobileSpacing?: boolean;
}

const spacerSection = defineType({
  name: 'spacerSection',
  title: 'Spacer',
  type: 'object',
  groups: defaultSectionGroups,
  icon: TbArrowsVertical,
  fields: [
    internalLabelField,
    {
      name: 'sectionPreview',
      title: 'Section Preview',
      type: 'image',
      components: { input: ReadOnlyImageInput },
      readOnly: true,
      group: 'internal'
    },
    {
      name: 'height',
      title: 'Desktop Height (px)',
      description: 'The height of the spacer on desktop in pixels. Default is 24px.',
      type: 'number',
      initialValue: 24,
      group: 'data',
      validation: (Rule) => Rule.min(0).max(500).integer()
    },
    {
      name: 'useSeparateMobileSpacing',
      title: 'Use Different Mobile Spacing',
      description: 'Enable this to set a different height for mobile devices',
      type: 'boolean',
      initialValue: false,
      group: 'data'
    },
    {
      name: 'mobileHeight',
      title: 'Mobile Height (px)',
      description: 'The height of the spacer on mobile devices in pixels.',
      type: 'number',
      initialValue: 24,
      group: 'data',
      validation: (Rule) => Rule.min(0).max(500).integer(),
      hidden: ({ parent }) => !parent?.useSeparateMobileSpacing
    }
  ],
  preview: {
    select: {
      height: 'height',
      mobileHeight: 'mobileHeight',
      useSeparateMobileSpacing: 'useSeparateMobileSpacing',
      internalLabel: 'internalLabel'
    },
    prepare(selection) {
      const { height = 24, mobileHeight = 24, useSeparateMobileSpacing, internalLabel } = selection;
      const subtitle = useSeparateMobileSpacing 
        ? `Desktop: ${height}px | Mobile: ${mobileHeight}px`
        : `${height}px height`;
      return {
        title: `Spacer`,
        subtitle: internalLabel || subtitle
      };
    }
  }
});

export default spacerSection;
