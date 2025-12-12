import { defineType } from 'sanity';
import { ICustomMedia } from './customMedia';
import { IButtonElement } from '../elements/button';

interface ICollectionHeader {
  logoTheme: 'light' | 'dark';
  layout: 'fullWidth' | 'split' | 'text';
  mediaOne: ICustomMedia;
  mediaTwo: ICustomMedia;
  addButton: boolean;
  button: IButtonElement;
  quote: any[];
  tagline: string;
}

const collectionHeader = defineType({
  name: 'collectionHeader',
  title: 'Collection Header',
  type: 'object',
  fields: [
    {
      name: 'layout',
      title: 'Layout',
      description: 'Select the layout of the collection header',
      type: 'string',
      options: {
        list: [
          { title: 'Full Width', value: 'fullWidth' },
          { title: 'Split', value: 'split' },
          { title: 'Text', value: 'text' }
        ],
        layout: 'radio',
        direction: 'horizontal'
      },
      initialValue: 'fullWidth'
    },

    {
      name: 'mediaOne',
      title: 'Media One',
      type: 'customMedia',
      hidden: ({ parent }) => parent?.layout === 'text'
    },
    {
      name: 'mediaTwo',
      title: 'Media Two',
      type: 'customMedia',
      description: '(Only used in split layout)',
      hidden: ({ parent }) => parent?.layout !== 'split'
    },
    {
      name: 'quote',
      title: 'Quote',
      type: 'blockContentSimple',
      hidden: ({ parent }) => parent?.layout !== 'text'
    },
    {
      name: `addButton`,
      title: `Add Button`,
      type: `boolean`,
      hidden: ({ parent }) => parent?.layout === 'text'
    },
       {
      name: 'tagline', // ADD THIS FIELD
      title: 'Tagline',
      type: 'string',
      description: 'Short tagline or subtitle for the collection',
    },
    {
      name: `button`,
      title: `Button`,
      type: `buttonElement`,
      hidden: ({ parent }) => !parent?.addButton || parent?.layout === 'text'
    }
  ],
  preview: {
    prepare() {
      return {
        title: `Collection Header`
      };
    }
  }
});

export default collectionHeader;
export type { ICollectionHeader };
