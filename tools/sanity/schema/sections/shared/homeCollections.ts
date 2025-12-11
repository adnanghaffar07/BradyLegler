import { defineType } from 'sanity';
import stripTitleTags from '../../../../../tools/sanity/helpers/stripTitleTags';

interface ICollectionItem {
  _key?: string; // for React key
  name: string;
  href: string;
  image: {
    asset: {
      _ref: string;
      _type: 'reference';
      url: string;
    };
    alt?: string;
  };
}

export const collectionItem = defineType({
  name: 'collectionItem',
  title: 'Collection Item',
  type: 'object',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      validation: Rule => Rule.required()
    },
    {
      name: 'href',
      title: 'Link',
      type: 'url',
      validation: Rule => Rule.required()
    }
  ],
  preview: {
    select: { title: 'name', media: 'image' },
    prepare: ({ title, media }) => ({
      title: title ? stripTitleTags(title) : 'Collection Item',
      media
    })
  }
});

export const homeCollections = defineType({
  name: 'homeCollections',
  title: 'Home Collections Section',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Section Title',
      type: 'string'
    },
    {
      name: 'items',
      title: 'Collections',
      type: 'array',
      of: [{ type: 'collectionItem' }]
    }
  ]
});

export type { ICollectionItem };
