import Header from './components/Header';
import Products from './components/Products';
import Sections from '@/components/Sections';
import { ICollectionDocument } from '@/tools/sanity/schema/documents/collection';

interface WebPageProps extends PageProps {
  data: ICollectionDocument;
}

const CollectionTemplate = async (props: WebPageProps) => {
  const { data, params, searchParams } = props;
  const sanityCollectionData = data;

  return (
    <>
      <Header sanityCollectionData={sanityCollectionData} />
      <div style={{ position: 'relative', zIndex: 10, backgroundColor: 'white', minHeight: '100vh' }}>
        <Products sanityCollectionData={sanityCollectionData} params={params} searchParams={searchParams} />
        <Sections sections={sanityCollectionData?.sections} params={params} searchParams={searchParams} />
      </div>
    </>
  );
};

export default CollectionTemplate;
