import { groq } from 'next-sanity';

const linkProjection = groq`{
  linkType,
  internalLink->{
    _type,
    title,
    slug,
    pathname,
    "slug": coalesce(store.slug.current, slug.current, pathname),
    "pathnameShopify": select(
      defined(store.slug.current) => "/" + store.slug.current + "/",
      null
    )
  },
  externalLink,
  phone,
  email,
  action
}`;

export default linkProjection;
