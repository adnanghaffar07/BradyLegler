type SanityImageAsset = {
  url: string;
  altText?: string;
  metadata: {
    dimensions: {
      width: number;
      height: number;
    };
    lqip?: string;
  };
};

type SanityCrop = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

type SanityHotspot = {
  x: number;
  y: number;
  height: number;
  width: number;
};

type SanityImageSimple = {
  asset: SanityImageAsset;
  crop?: SanityCrop;
  hotspot?: SanityHotspot;
  altText?: string;
};

type SanityAspectRatio = 'natural' | '16-9' | '3-2' | '1-1' | '4-3';

interface SanityImageAdvanced extends SanityImageSimple {
  aspectRatio?: SanityAspectRatio;
}

type SanityImage = SanityImageSimple | SanityImageAdvanced;
