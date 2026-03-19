import { defineType } from 'sanity';
import { MdLink } from 'react-icons/md';
import { CenterTextComponent } from '../../components/BlockComponents';
import { TbAlignCenter } from 'react-icons/tb';
import { linkElementFields } from '../elements/link';

const blockContentSimple = defineType({
  title: 'Block Content',
  name: 'blockContentSimple',
  type: 'array',
  of: [
    {
      title: 'Block',
      type: 'block',
      styles: [{ title: 'Normal', value: 'normal' }],
      lists: [
        { title: 'Bullet List', value: 'bullet' },
        { title: 'Numbered List', value: 'number' }
      ],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
          { title: 'Underline', value: 'underline' }
        ],
        annotations: [
          {
            title: 'Link',
            name: 'link',
            icon: MdLink,
            type: 'object',
            fields: linkElementFields
          }
        ]
      }
    }
  ]
});

const blockContentStandard = defineType({
  title: 'Block Content',
  name: 'blockContentStandard',
  type: 'array',
  of: [
    {
      title: 'Block',
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H1', value: 'h1' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'H4', value: 'h4' },
        { title: 'H5', value: 'h5' },
        { title: 'H6', value: 'h6' }
      ],
      lists: [
        { title: 'Bullet List', value: 'bullet' },
        { title: 'Numbered List', value: 'number' }
      ],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
          { title: 'Underline', value: 'underline' }
        ],
        annotations: [
          {
            title: 'Link',
            name: 'link',
            icon: MdLink,
            type: 'object',
            fields: linkElementFields
          }
        ]
      }
    }
  ]
});

const blockContentAdvanced = defineType({
  title: 'Block Content',
  name: 'blockContentAdvanced',
  type: 'array',
  of: [
    {
      title: 'Block',
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H1', value: 'h1' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'H4', value: 'h4' },
        { title: 'H5', value: 'h5' },
        { title: 'H6', value: 'h6' }
      ],
      lists: [
        { title: 'Bullet List', value: 'bullet' },
        { title: 'Numbered List', value: 'number' }
      ],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
          { title: 'Underline', value: 'underline' },
          {
            title: 'Center Align Text',
            value: 'centerAlignText',
            icon: TbAlignCenter,
            component: CenterTextComponent
          }
        ],
        annotations: [
          {
            title: 'Link',
            name: 'link',
            icon: MdLink,
            type: 'object',
            fields: linkElementFields
          }
        ]
      }
    },
    {
      type: 'divider',
      name: 'divider'
    },
    {
      title: 'Image',
      name: 'blockContentImage',
      type: 'blockContentImage'
    },
    {
      title: 'Video',
      name: 'blockContentVideo',
      type: 'blockContentVideo'
    },
    {
      title: 'Buttons',
      name: 'blockContentButtons',
      type: 'blockContentButtons'
    }
  ]
});

const blockContentImage = defineType({
  title: 'Image',
  name: 'blockContentImage',
  type: 'object',
  fields: [
    {
      title: 'Image',
      name: 'image',
      type: 'imageElementSimple'
    },
    {
      title: 'Caption',
      name: 'caption',
      type: 'string'
    }
  ],
  preview: {
    select: {
      caption: 'caption',
      altText: 'image.altText',
      image: 'image.image'
    },
    prepare({ caption, image, altText }) {
      return {
        title: caption || altText || 'No caption',
        media: image
      };
    }
  }
});

const blockContentVideo = defineType({
  title: 'Video',
  name: 'blockContentVideo',
  type: 'object',
  fields: [
    {
      name: `videoUrl`,
      title: `Video URL (Vimeo, YouTube, etc.)`,
      type: `url`,
      placeholder: `https://...`
    }
  ],
  preview: {
    select: {
      title: 'videoUrl'
    },
    prepare({ title }) {
      return { title };
    }
  }
});

const blockContentButtons = defineType({
  title: 'Buttons',
  name: 'blockContentButtons',
  type: 'object',
  fields: [
    {
      title: 'Buttons',
      name: 'buttons',
      type: 'array',
      of: [
        {
          title: 'Button',
          type: 'buttonElement'
        }
      ]
    }
  ],
  preview: {
    select: {
      buttons: 'buttons'
    },
    prepare({ buttons }) {
      return {
        title: buttons?.length ? `${buttons.length} button${buttons.length > 1 ? 's' : ''}` : 'No buttons added'
      };
    }
  }
});

export {
  blockContentSimple,
  blockContentStandard,
  blockContentAdvanced,
  blockContentImage,
  blockContentVideo,
  blockContentButtons
};
