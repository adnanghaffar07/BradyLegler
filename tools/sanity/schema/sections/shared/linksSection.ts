import { TbLayoutGrid } from 'react-icons/tb';
import defaultSectionGroups from '../../common/defaultSectionGroups';
import internalLabelField from '../../common/internalLabelField';
import ReadOnlyImageInput from '../../../components/ReadOnlyImageInput';
import { defineType } from 'sanity';
import { IButtonElement } from '../../elements/button';
import thumbnail from '../../../../../sections/shared/LinksSection/thumbnail.png';

interface ILinksSection {
  tagline: string;
  title: string;
  content: SanityTextBlock[];
  layout: 'small' | 'large';
  cards: {
    image: SanityImage;
    title: string;
    content: SanityTextBlock[];
    addButton: boolean;
    button: IButtonElement;
  }[];
  className?: string;
  links: {
    groupTitle: string;
    links: {
      label: string;
      link: IButtonElement;
    }[];
  }[];
  additionalLinks: {
    groupTitle: string;
    links: {
      label: string;
      link: IButtonElement;
    }[];
  };
}

const linksSection = defineType({
  name: 'linksSection',
  title: 'Links',
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
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: ['small', 'large'],
        layout: 'select'
      },
      group: 'data'
    },
    {
      name: 'links',
      title: 'Links Group',
      type: 'array',
      of: [{ type: 'linkGroup' }],
      group: 'data'
    },
    {
      name: 'additionalLinks',
      title: 'Additional Links',
      type: 'linkGroup',
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
        title: `Links`,
        subtitle: selection?.internalLabel
      };
    }
  }
});

export default linksSection;
export type { ILinksSection };
