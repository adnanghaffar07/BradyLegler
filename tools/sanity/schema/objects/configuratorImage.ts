import { defineField, defineType } from 'sanity';
import { METAL_OPTIONS, FINISH_OPTIONS } from '@/templates/ProductTemplate/components/SubwayRingCustomizer/options';

/**
 * One photograph of a customizable product in a given metal and stone or enamel.
 *
 * Metal and finish are dropdowns rather than free text on purpose. A mistyped value
 * produces no image AND no error - the configurator falls back to its generated
 * illustration, so nobody notices until someone spots a drawing where a photograph
 * should be. A constrained list makes an unmatchable row impossible to author.
 *
 * The lists come from the configurator's own options module, so the values offered
 * here and the values matched at runtime cannot drift apart.
 */
const configuratorImage = defineType({
  name: 'configuratorImage',
  title: 'Configurator Image',
  type: 'object',
  fields: [
    defineField({
      name: 'metal',
      title: 'Metal',
      type: 'string',
      options: { list: METAL_OPTIONS },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'finish',
      title: 'Stone or Enamel',
      type: 'string',
      options: { list: FINISH_OPTIONS },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      validation: Rule => Rule.required()
    })
  ],
  preview: {
    select: { metal: 'metal', finish: 'finish', media: 'image' },
    prepare({ metal, finish, media }) {
      return {
        title: metal && finish ? `${metal} — ${finish}` : 'Incomplete combination',
        media
      };
    }
  }
});

export default configuratorImage;
