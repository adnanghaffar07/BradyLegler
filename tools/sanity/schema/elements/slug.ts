import slugify from 'slugify';
import { defineType } from 'sanity';
import SlugInput from '../../components/SlugInput';
import { client } from '../../lib/client';

const slugElement = defineType({
  name: 'slugElement',
  title: 'Slug',
  type: 'slug',
  options: {
    source: `title`,
    slugify: input => `/${slugify(input, { lower: true, strict: true })}`
  },
  components: {
    input: SlugInput
  },
  validation: Rule =>
    Rule.custom(async (slug, { document, type, ...rest }) => {
      const currentSlug = slug?.current;
      // const currentPathname = document?.pathname;
      // Construct currentPathname instead, in case document?.pathname still hasn't been set (first creation)
      const currentPathname = type?.options?.prefix ? `${type.options.prefix}${currentSlug}` : currentSlug;
      const currentDocumentId = document?._id;

      if (currentPathname !== document?.pathname) return 'Slug needs to be saved. Click anywhere to save.';

      if (currentPathname && currentDocumentId) {
        const allPathnames = await client.fetch<{ _type: string; _id: string; pathname: string }[]>(
          `*[_type in $types && !(_id in path("drafts.**"))]{ _type, _id, pathname }`,
          { types: ['page', 'artwork'] }
        );

        const isNotUnique = allPathnames.find(pathnameItem => {
          return (
            pathnameItem?._id !== currentDocumentId.replace(/^drafts\./, '') &&
            pathnameItem?.pathname === currentPathname
          );
        });

        if (isNotUnique) return 'Slug is already in use';
      }

      if (typeof currentSlug === 'undefined') {
        return 'Required';
      }
      if (!currentSlug?.match(/^[a-z0-9/]+(?:-[a-z0-9/]+)*$/g)) {
        return 'Please format URL to be valid slug.';
      }
      if (currentSlug?.includes('//')) {
        return 'Slug cannot contain consecutive slashes.';
      }
      if (currentSlug?.[0] !== '/') {
        return 'Please add initial forward slash.';
      }
      return true;
    }),
  description:
    'Please ensure forward slash / is added to beginning of url e.g. /example-page or /example-page/new-page'
});

export default slugElement;
