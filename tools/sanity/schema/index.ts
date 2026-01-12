import { SchemaTypeDefinition } from 'sanity';

// Documents
import page from './documents/page';
import product from './documents/product';
import collection from './documents/collection';
import productVariant from './documents/productVariant';
import route from './documents/route';
import settings from './documents/settings';
import headerDocument from './documents/headerDocument';
import footerDocument from './documents/footerDocument';
import sizeGuideDocument from './documents/sizeGuideDocument';
import { socialMediaDocument, socialMediaItem } from './documents/socialMediaDocument';

// Global Components
// import globalLogos from './globalComponents/globalLogos';

// Artwork
import artwork from './documents/artwork';

// Objects
import {
  blockContentSimple,
  blockContentStandard,
  blockContentAdvanced,
  blockContentImage,
  blockContentVideo,
  blockContentButtons
} from './objects/blockContent';
import divider from './objects/divider';
import { footer, linkGroup } from './objects/footer';
import { header, navLink, navSublink } from './objects/header';
import redirect from './objects/redirect';
import seo from './objects/seo';
import { sectionFields, spacingOptions, themeOptions } from './objects/sectionFields';
import featureCard from './objects/featureCard';
import featureMedia from './objects/featureMedia';
import gallery from './objects/gallery';
import collectionHeader from './objects/collectionHeader';
import customMedia from './objects/customMedia';
import alignMedia from './objects/alignMedia';
import sizeGuideTable from '../schema/objects/sizeGuideTable';

// Shopify objects
import inventory from './objects/shopify/inventory';
import option from './objects/shopify/option';
import proxyString from './objects/shopify/proxyString';
import priceRange from './objects/shopify/priceRange';
import shopifyCollection from './objects/shopify/shopifyCollection';
import shopifyCollectionRule from './objects/shopify/shopifyCollectionRule';
import shopifyProduct from './objects/shopify/shopifyProduct';
import shopifyProductVariant from './objects/shopify/shopifyProductVariant';
import quote from './objects/quote';

// Common
import icon from './elements/icon';
import title from './elements/title';
import slugElement from './elements/slug';
import { imageElementAdvanced, imageElementSimple } from './elements/image';
import linkElement from './elements/link';
import buttonElement from './elements/button';

// Shared Sections
import headerHeroSection from './sections/shared/headerHeroSection';
import logosSection from './sections/shared/logosSection';
import productsSection from './sections/shared/productsSection';
import quoteSection from './sections/shared/quoteSection';
import { twoColMediaSection } from './sections/shared/twoColMediaSection';
import videoSection from './sections/shared/videoSection';
import imageCenteredSection from './sections/shared/imageCenteredSection';
import twoColTextSection from './sections/shared/twoColTextSection';
import linksSection from './sections/shared/linksSection';
import listArtworkSection from './sections/shared/listArtworkSection';
import discoverMoreSection from './sections/shared/discoverMoreSection';
import announcementSection from './sections/shared/announcementSection';
import fullScreenImageSection from './sections/shared/fullScreenImageSection';

// Product Sections
import viewedProductsSection from './sections/product/viewedProductsSection';
import productReviewsSection from './sections/product/productReviewsSection';
import { homeCollections } from './sections/shared/homeCollections';

const schema: SchemaTypeDefinition[] = [
  // Documents
  artwork,
  collection,
  footerDocument,
  headerDocument,
  page,
  product,
  productVariant,
  route,
  settings,
  socialMediaDocument,
  sizeGuideDocument,
  homeCollections,

  // Global Components
  // globalLogos,

  // Objects
  alignMedia,
  blockContentSimple,
  blockContentStandard,
  blockContentAdvanced,
  blockContentImage,
  blockContentVideo,
  blockContentButtons,
  divider,
  featureCard,
  featureMedia,
  footer,
  linkGroup,
  header,
  navLink,
  navSublink,
  redirect,
  seo,
  sectionFields,
  socialMediaItem,
  spacingOptions,
  themeOptions,
  collectionHeader,
  customMedia,
  sizeGuideTable,
  quote,
  ...gallery,

  // Shopify objects
  inventory,
  option,
  proxyString,
  priceRange,
  shopifyCollection,
  shopifyCollectionRule,
  shopifyProduct,
  shopifyProductVariant,

  // Elements
  icon,
  title,
  imageElementSimple,
  imageElementAdvanced,
  linkElement,
  buttonElement,
  slugElement,

  // Sections
  headerHeroSection,
  productsSection,
  quoteSection,
  twoColMediaSection,
  videoSection,
  imageCenteredSection,
  twoColTextSection,
  linksSection,
  listArtworkSection,
  discoverMoreSection,
  announcementSection,
  fullScreenImageSection,
  // Product Sections
  viewedProductsSection,
  productReviewsSection
];

export default schema;
