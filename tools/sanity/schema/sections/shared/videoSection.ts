import { TbMovie } from 'react-icons/tb';
import { defineType } from 'sanity';
import defaultSectionGroups from '../../common/defaultSectionGroups';
import internalLabelField from '../../common/internalLabelField';
import ReadOnlyImageInput from '../../../components/ReadOnlyImageInput';
import VideoUrlInput from '../../../components/VideoUrlInput';
import { IButtonElement } from '../../elements/button';
import thumbnail from '../../../../../sections/shared/VideoSection/thumbnail.png';

interface IVideoSection {
  videoType: 'file' | 'url';
  videoFile: any; // @TODO SanityFile type
  videoUrl: string;
  thumbnail: SanityImage;
  addButton: boolean;
  button?: IButtonElement;
}

const videoSection = defineType({
  name: 'videoSection',
  title: 'Video',
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
      name: 'videoType',
      title: 'Video Type',
      type: 'string',
      options: {
        list: [
          { value: 'file', title: 'Video File (.mp4)' },
          { value: 'url', title: 'Video URL (Vimeo, YouTube, etc.)' }
        ],
        layout: 'radio',
        direction: 'horizontal'
      },
      initialValue: 'url',
      group: 'data'
    },
    {
      name: 'videoFile',
      title: 'Video File',
      type: 'file',
      group: 'data',
      hidden: ({ parent }) => parent?.videoType !== 'file'
    },
    {
      name: `videoUrl`,
      title: `Video URL (Vimeo, YouTube, etc.)`,
      type: `url`,
      placeholder: `https://...`,
      group: 'data',
      components: {
        input: VideoUrlInput,
        // @ts-ignore
        options: {
          thumbnailField: 'thumbnail'
        }
      },
      hidden: ({ parent }) => parent?.videoType !== 'url'
    },
    {
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      group: 'data',
      hidden: ({ parent }) => parent?.videoType !== 'url'
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
      mediaType: 'mediaType'
    },
    prepare(selection) {
      return {
        title: `Video`,
        subtitle: selection?.internalLabel
      };
    }
  }
});

export default videoSection;
export type { IVideoSection };
