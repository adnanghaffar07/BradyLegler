import { TbSection } from 'react-icons/tb';
import defaultSectionGroups from '../../common/defaultSectionGroups';
import internalLabelField from '../../common/internalLabelField';
import ReadOnlyImageInput from '../../../components/ReadOnlyImageInput';
import { defineField, defineType } from 'sanity';
import thumbnail from '../../../../../sections/shared/ProductsSection/thumbnail.png';
import { IProductDocument } from '../../documents/product';

interface IProductsSection {
  title: string;
  products: IProductDocument[];
}

const productsSection = defineType({
  name: 'productsSection',
  title: 'Products',
  type: 'object',
  groups: defaultSectionGroups,
  icon: TbSection,
  fields: [
    internalLabelField,
    {
      name: 'sectionPreview',
      title: 'Section Preview',
      type: 'image',
      components: { input: ReadOnlyImageInput },
      // @ts-ignore
      imageUrl: thumbnail.src,
      readOnly: true,
      group: 'internal'
    },
    // Define fields here
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'data'
    },
    defineField({
      name: 'products',
      title: 'Products',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'product' }], options: { filter: `store.status != 'archived'` } }],
      group: 'data'
    }),
  ],
  preview: {
    prepare() {
      return {
        title: `Products`
      };
    }
  }
});

export default productsSection;
export type { IProductsSection };
