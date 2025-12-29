import { defineType } from 'sanity';
import stripTitleTags from '@/tools/sanity/helpers/stripTitleTags';
import { FiGrid } from 'react-icons/fi';
import defaultSectionGroups from '../../common/defaultSectionGroups';

// In your collectionItem schema file
export interface ICollectionItem {
  _key?: string;
  image: {
    asset: {
      _ref: string;
      _type: 'reference';
    };
    alt?: string;
  };
  collection?: {
    store?: {
      title?: string;
      slug?: {
        current?: string;
      };
    };
  };
}
export const collectionItem = defineType({
  name: 'collectionItem',
  title: 'Collection Item',
  type: 'object',
  icon: FiGrid,
  fields: [
    {
      name: 'collection',
      title: 'Collection',
      type: 'reference',
      to: [{ type: 'collection' }],
      validation: Rule => Rule.required(),
      description: 'Select a collection to link to'
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      validation: Rule => Rule.required()
    }
  ],
  preview: {
    select: {
      title: 'collection->titleProxy',  // Changed from store.title
      subtitle: 'collection->slugProxy', // Changed from store.slug.current
      media: 'image'
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title ? stripTitleTags(title) : 'Collection Item',
        subtitle: subtitle ? `/${subtitle}` : '',
        media
      };
    }
  }
});

export const homeCollections = defineType({
  name: 'homeCollections',
  title: 'Home Collections Section',
  type: 'document',
  icon: FiGrid,
  groups: defaultSectionGroups,
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