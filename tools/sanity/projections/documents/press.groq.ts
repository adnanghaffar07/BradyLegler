import { groq } from 'next-sanity';
import sectionsProjection from '../common/sections.groq';
import imageProjection from '../common/image.groq';

const pressProjection = groq`{
  _createdAt,
  _updatedAt,
  title,
  subtitle,
  slug,
  pathname,
  publishDate,
  content,
  featureImage${imageProjection},
  sections[]${sectionsProjection},
  seoData
}`;

export default pressProjection;
