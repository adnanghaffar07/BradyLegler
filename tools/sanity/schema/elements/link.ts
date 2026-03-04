import { defineType, ObjectDefinition } from 'sanity';

interface ILinkElement {
  linkType?: 'internal' | 'external' | 'phone' | 'email' | 'action';
  internalLink?: {
    _ref?: string;
    title?: string;
    slug: {
      current: string;
    };
    pathname?: string;
    pathnameShopify?: string;
  };
  externalLink?: string;
  phone?: string;
  email?: string;
  action?: 'openContactSidebar';

  // Catch
  href?: string;
}

// These fields are exported for use in blockContent schema annotations
const linkElementFields: ObjectDefinition['fields'] = [
  {
    name: 'linkType',
    title: 'Link Type',
    type: 'string',
    options: {
      list: [
        { value: 'internal', title: 'Internal' },
        { value: 'external', title: 'External' },
        { value: 'phone', title: 'Phone' },
        { value: 'email', title: 'Email' },
        { value: 'action', title: 'Action' }
      ],
      layout: 'radio',
      direction: 'horizontal'
    }
  },
  {
    name: 'internalLink',
    title: 'Internal Link',
    type: 'reference',
    to: [
      { type: 'page' },
      { type: 'route' },
      { type: 'artwork' },
      { type: 'collection' },
      { type: 'product' }
    ],
    options: {
      disableNew: false,
    },
    hidden: ({ parent }) => parent?.linkType !== 'internal'
  },
  {
    name: 'externalLink',
    title: 'External Link',
    type: 'url',
    hidden: ({ parent }) => parent?.linkType !== 'external'
  },
  {
    name: 'phone',
    title: 'Phone',
    type: 'string',
    hidden: ({ parent }) => parent?.linkType !== 'phone'
  },
  {
    name: 'email',
    title: 'Email',
    type: 'string',
    hidden: ({ parent }) => parent?.linkType !== 'email'
  },
  {
    name: 'action',
    title: 'Action',
    type: 'string',
    options: {
      list: [
        { value: 'openContactSidebar', title: 'Open Concierge Sidebar' }
      ],
      layout: 'dropdown'
    },
    hidden: ({ parent }) => parent?.linkType !== 'action'
  }
];

const linkElement = defineType({
  name: 'linkElement',
  title: 'Link',
  type: 'object',
  fields: linkElementFields,
  options: {
    collapsible: false
  }
});

export default linkElement;
export { linkElementFields };
export type { ILinkElement };
