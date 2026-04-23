import { TbGridDots } from 'react-icons/tb';
import defaultSectionGroups from '../../common/defaultSectionGroups';
import internalLabelField from '../../common/internalLabelField';
import { defineType } from 'sanity';

export interface IImageGalleryItem {
  image: any;
  link?: any;
  size?: 'small' | 'medium' | 'large';
}

export interface IImageGallerySection {
  internalLabel?: string;
  images: IImageGalleryItem[];
  columns?: number;
  gap?: string;
  className?: string;
}

const imageGallerySection = defineType({
  name: 'imageGallerySection',
  title: 'Image Gallery',
  type: 'object',
  groups: defaultSectionGroups,
  icon: TbGridDots,
  fields: [
    internalLabelField,
    {
      name: 'sectionPreview',
      title: 'Section Preview',
      type: 'string',
      readOnly: true,
      group: 'internal',
      initialValue: 'Masonry-style image gallery with multiple images of varying sizes',
      hidden: true
    },
    {
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'galleryItem',
          title: 'Gallery Item',
          fields: [
            {
              name: 'image',
              title: 'Image',
              type: 'imageElementSimple',
              validation: Rule => Rule.required()
            },
            {
              name: 'size',
              title: 'Size',
              type: 'string',
              options: {
                list: [
                  { title: 'Small (40vh)', value: 'small' },
                  { title: 'Medium (60vh)', value: 'medium' },
                  { title: 'Large (100vh)', value: 'large' }
                ],
                layout: 'radio'
              },
              initialValue: 'medium',
              description: 'Max 3 items per row. Rows are centered.'
            },
            {
              name: 'link',
              title: 'Link (Optional)',
              type: 'buttonElement',
              description: 'Make this image clickable'
            }
          ],
          preview: {
            select: {
              image: 'image',
              size: 'size'
            },
            prepare(selection) {
              return {
                title: `Gallery Item (${selection?.size || 'medium'})`
              };
            }
          }
        }
      ],
      group: 'data',
      validation: Rule => Rule.required().min(1)
    },
    {
      name: 'columns',
      title: 'Columns (Desktop)',
      type: 'number',
      initialValue: 3,
      group: 'styles',
      description: 'Number of columns on desktop (2-5 recommended)'
    },
    {
      name: 'gap',
      title: 'Gap Between Images',
      type: 'string',
      options: {
        list: [
          { title: 'Small (0.5rem)', value: '0.5rem' },
          { title: 'Medium (1rem)', value: '1rem' },
          { title: 'Large (1.5rem)', value: '1.5rem' },
          { title: 'Extra Large (2rem)', value: '2rem' }
        ],
        layout: 'dropdown'
      },
      initialValue: '1rem',
      group: 'styles'
    }
  ],
  preview: {
    select: {
      internalLabel: 'internalLabel',
      images: 'images'
    },
    prepare(selection) {
      return {
        title: `Image Gallery (${selection?.images?.length || 0} images)`,
        subtitle: selection?.internalLabel
      };
    }
  }
});

export { imageGallerySection };
