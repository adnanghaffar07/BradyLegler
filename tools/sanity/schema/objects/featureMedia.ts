import { defineType } from 'sanity';

interface IFeatureMedia {
  enable: boolean;
  mediaType: 'video' | 'image';
  image?: SanityImage;
  video?: {
    url: string;
  };
}
// featureMedia.ts

const featureMedia = defineType({
  name: 'featureMedia',
  title: 'Feature Media',
  type: 'object',
  initialValue: {
    enable: false
  },
  fields: [
    {
      name: 'enable',
      title: 'Enable Custom Feature Media',
      description: 'If disabled, the Shopify feature media product will be used',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'mediaItems',
      title: 'Media Items',
      type: 'array',
      hidden: ({ parent }) => parent?.enable !== true,
      of: [
        {
          type: 'object',
          name: 'mediaItem',
          fields: [
            {
              name: 'mediaType',
              title: 'Media Type',
              type: 'string',
              options: {
                list: [
                  { value: 'image', title: 'Image' },
                  { value: 'video', title: 'Video' }
                ],
                layout: 'select'
              },
              initialValue: 'image'
            },
            {
              name: 'image',
              title: 'Image',
              type: 'imageElementSimple',
              hidden: ({ parent }) => parent?.mediaType !== 'image'
            },
            {
              name: 'video',
              title: 'Video',
              type: 'file',
              options: {
                accept: 'video/*'
              },
              hidden: ({ parent }) => parent?.mediaType !== 'video'
            },
            {
              name: 'alt',
              title: 'Alt Text',
              type: 'string'
            }
          ],
          preview: {
            select: {
              title: 'alt',
              mediaType: 'mediaType',
              image: 'image.asset',
              video: 'video.asset'
            },
            prepare(selection) {
              const { title, mediaType, image, video } = selection;
              return {
                title: title || `Media (${mediaType})`,
                subtitle: mediaType,
                media: mediaType === 'image' ? image : video
              };
            }
          }
        }
      ]
    }
  ],
  options: {
    collapsible: false
  }
});

export default featureMedia;
export type { IFeatureMedia };
