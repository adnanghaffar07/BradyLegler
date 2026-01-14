// headerHeroSection.ts
import { FiStar } from 'react-icons/fi';
import defaultSectionGroups from '../../common/defaultSectionGroups';
import internalLabelField from '../../common/internalLabelField';
import ReadOnlyImageInput from '../../../components/ReadOnlyImageInput';
import { defineType } from 'sanity';
import thumbnail from '../../../../../sections/shared/HeaderHeroSection/thumbnail.png';
import { IButtonElement } from '../../elements/button';
import VideoUrlInput from '../../../components/VideoUrlInput'; // Import if you have this

interface IHeaderHeroSection {
  tagline?: string;
  title?: string;
  content?: SanityTextBlock[];
  addButton?: boolean;
  button?: IButtonElement;
  mediaType: 'image' | 'video'; // New field
  image?: SanityImage; // Make optional
  videoType?: 'file' | 'url'; // Video fields
  videoFile?: any;
  videoUrl?: string;
  thumbnail?: SanityImage;
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
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Short text displayed above the button',
      group: 'data'
    },
    {
      name: 'mediaType',
      title: 'Media Type',
      type: 'string',
      options: {
        list: [
          { value: 'image', title: 'Image' },
          { value: 'video', title: 'Video' }
        ],
        layout: 'radio',
        direction: 'horizontal'
      },
      initialValue: 'image',
      group: 'data'
    },
    {
      name: 'image',
      title: 'Image',
      type: 'imageElementSimple',
      group: 'data',
      hidden: ({ parent }) => parent?.mediaType !== 'image'
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
      initialValue: 'file',
      group: 'data',
      hidden: ({ parent }) => parent?.mediaType !== 'video'
    },
    {
      name: 'videoFile',
      title: 'Video File',
      type: 'file',
      options: {
        accept: 'video/*'
      },
      group: 'data',
      hidden: ({ parent }) => parent?.mediaType !== 'video' || parent?.videoType !== 'file'
    },
    {
      name: 'videoUrl',
      title: 'Video URL (Vimeo, YouTube, etc.)',
      type: 'url',
      placeholder: 'https://...',
      group: 'data',
      components: {
        input: VideoUrlInput, // If you have this component
        // @ts-ignore
        options: {
          thumbnailField: 'thumbnail'
        }
      },
      hidden: ({ parent }) => parent?.mediaType !== 'video' || parent?.videoType !== 'url'
    },
    {
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      group: 'data',
      hidden: ({ parent }) => parent?.mediaType !== 'video' || parent?.videoType !== 'url'
    },
    {
      name: 'addButton',
      title: 'Add Button',
      type: 'boolean',
      group: 'data'
    },
    {
      name: 'button',
      title: 'Button',
      type: 'buttonElement',
      group: 'data',
      hidden: ({ parent }) => !parent?.addButton
    }
  ],
  preview: {
    select: {
      internalLabel: 'internalLabel',
      mediaType: 'mediaType'
    },
    prepare(selection) {
      return {
        title: `Header - Hero`,
        subtitle: `${selection?.mediaType || 'Image'} | ${selection?.internalLabel || ''}`
      };
    }
  }
});

export default headerHeroSection;
export type { IHeaderHeroSection };
