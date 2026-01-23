import { TbLayoutGrid } from 'react-icons/tb';
import defaultSectionGroups from '../../common/defaultSectionGroups';
import internalLabelField from '../../common/internalLabelField';
import ReadOnlyImageInput from '../../../components/ReadOnlyImageInput';
import { defineType } from 'sanity';
import thumbnail from '../../../../../sections/shared/AnnouncementSection/thumbnail.png';
import { IButtonElement } from '../../elements/button';

interface IAnnouncementSection {
  title?: string;
  content?: SanityTextBlock[];
  addButton?: boolean;
  button?: IButtonElement;
  align?: 'left' | 'center' | 'right';
  addDownloadButton?: boolean;
  downloadFile?: {
    downloadButtonText?: string;
    asset: {
      url?: string;
    };
  };
}

const announcementSection = defineType({
  name: 'announcementSection',
  title: 'Announcement',
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
      name: `align`,
      title: `Align`,
      type: `string`,
      options: {
        list: ['left', 'center', 'right'],
        layout: 'radio',
        direction: 'horizontal'
      },
      initialValue: 'left',
      group: 'data'
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'data'
    },
    {
      name: `content`,
      title: `Content`,
      type: `blockContentSimple`,
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
      name: `addDownloadButton`,
      title: `Add Download Button`,
      type: `boolean`,
      group: 'data'
    },
    {
      title: 'File',
      name: 'downloadFile',
      description: 'Set a file to be downloaded',
      type: 'file',
      fields: [
        {
          name: 'downloadButtonText',
          type: 'string',
          title: 'Button Text'
        }
      ],
      group: 'data',
      hidden: ({ parent }) => !parent?.addDownloadButton
    },
  ],
  preview: {
    select: {
      internalLabel: 'internalLabel'
    },
    prepare(selection) {
      return {
        title: `Announcement`,
        subtitle: selection?.internalLabel
      };
    }
  }
});

export default announcementSection;
export type { IAnnouncementSection };
