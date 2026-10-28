import { defineType } from 'sanity';
import { imageElementAdvanced } from '../elements/image';
import stripTitleTags from '@/tools/sanity/helpers/stripTitleTags';

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
      // On a customizable product the shopper is looking at the configuration they
      // just chose, so a studio shot of the same ring in a different stone sits
      // underneath contradicting it. Rather than guess which images those are - a
      // rule based on shape breaks the first time someone uploads a square editorial
      // shot - the choice is the editor's, per image.
      //
      // It only affects the customizer page. Every other product page shows the
      // gallery in full, so ticking this never hides an image from the main site.
      name: 'hideOnCustomizer',
      title: 'Hide on the customizer page',
      description:
        'Tick this for shots of the piece in one fixed stone or enamel. Model and ' +
        'campaign imagery should stay visible. Has no effect on other product pages.',
      type: 'boolean',
      initialValue: false
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
