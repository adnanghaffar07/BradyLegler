import CollectionRowClient from './CollectionRowClient';

interface IGalleryMedia {
  _type: 'image' | 'video';
  src?: string;
  altText?: string;
  width?: number;
  height?: number;
  url?: string;
}

interface IGalleryImage {
  src: string;
  altText?: string;
  width?: number;
  height?: number;
}

interface ICollectionMediaItem {
  mediaType?: 'video' | 'image';
  alt?: string;
  image?: {
    asset?: {
      url: string;
      metadata?: {
        dimensions?: {
          width: number;
          height: number;
        };
      };
    };
  };
  video?: {
    asset?: {
      url: string;
    };
  };
}

interface IProduct {
  _id: string;
  store: {
    title: string;
    slug: {
      current: string;
    };
    previewImageUrl?: string;
    priceRange?: {
      minVariantPrice: number;
      maxVariantPrice: number;
    };
    gid?: string;
  };
  gallery?: {
    media?: IGalleryMedia[];
  };
  galleryImages?: IGalleryImage[];
  collectionMedia?: {
    enable?: boolean;
    mediaItems?: ICollectionMediaItem[];
    mediaType?: 'image' | 'video';
    video?: {
      asset?: {
        url: string;
      };
    };
    image?: {
      asset?: {
        url: string;
        metadata: {
          dimensions: {
            height: number;
            width: number;
          };
        };
      };
    };
  };
}

interface IHomeCollectionsSection {
  title?: string;
  products?: IProduct[];
}

const HomeCollectionsSection = async ({ title, products = [] }: IHomeCollectionsSection) => {
  // Simply use products directly - users add them manually in Sanity
  const finalProducts = products;

  return (
    <CollectionRowClient
      title={title}
      products={finalProducts}
    />
  );
};

export default HomeCollectionsSection;
