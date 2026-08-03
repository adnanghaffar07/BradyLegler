import { defineType } from 'sanity';
import { imageElementAdvanced } from '../elements/image';
import stripTitleTags from '../../helpers/stripTitleTags';

interface IGalleryVideo {
  video?: {
    asset: {
      url: string;
      _ref: string;
      _type: 'reference';
    };
    title?: string;
  };
  size?: 'centered' | 'fullWidth';
}

interface IGallery {
  enable: boolean;
  mediaType: 'video' | 'image';
  medias?: (SanityImage | IGalleryVideo)[]; //@TODO - check if this is correct
}

export const galleryVideo = defineType({
  name: 'galleryVideo',
  title: 'Video',
  type: 'object',
  fields: [
    {
      name: 'video',
      title: 'Video',
      description: 'Upload a video file',
      type: 'file'
    },
    {
      name: 'size',
      title: 'Size',
      type: 'string',
      options: {
        list: [
          { value: 'centered', title: 'Centered' },
          { value: 'fullWidth', title: 'Full Widtth' }
        ],
        layout: 'select',
        direction: 'horizontal'
      }
    }
  ],

  preview: {
    select: {
      title: 'title'
    },
    prepare: selection => ({
      title: 'Video'
    })
  }
});

export const galleryImage = defineType({
  ...imageElementAdvanced,
  name: 'galleryImage',
  fields: [
    {
      name: 'size',
      title: 'Size',
      type: 'string',
      options: {
        list: [
          { value: 'centered', title: 'Centered' },
          { value: 'fullWidth', title: 'Full Widtth' }
        ],
        layout: 'select',
        direction: 'horizontal'
      }
    },
    ...imageElementAdvanced.fields
  ]
});

export const gallery = defineType({
  name: 'gallery',
  title: 'Gallery',
  type: 'array',
  of: [{ type: 'galleryVideo' }, { type: `galleryImage` }]
});

export type { IGallery };
const galleryObjects = [galleryVideo, galleryImage, gallery];
export default galleryObjects;
