// lib/getHeaderNav.ts
import { groq } from 'next-sanity';
import type { IHeaderDocument } from '@/tools/sanity/schema/documents/headerDocument';
import { client } from '@/tools/sanity/lib/client';

export const getHeaderNav = async (): Promise<IHeaderDocument> => {
  const query = groq`
    *[_type == "headerDocument"][0]{
      header{
        navItems[]{
          title,
          side,
          dropdown,
          link{
            ...,
            internalLink->{
              _type,
              title,
              "slug": coalesce(store.slug.current, slug.current, pathname),
              pathname
            }
          },
          navSublinks[]{
            title,
            requiresPasscode,
            passcode,
            image{
              asset->{
                _id,
                url
              },
              alt
            },
            link{
              ...,
              internalLink->{
                _type,
                title,
                "slug": coalesce(store.slug.current, slug.current, pathname),
                pathname
              }
            },
            navSublinks[]{
              title,
              requiresPasscode,
              passcode,
              image{
                asset->{
                  _id,
                  url
                },
                alt
              },
              link{
                ...,
                internalLink->{
                  _type,
                  title,
                  "slug": coalesce(store.slug.current, slug.current, pathname),
                  pathname
                }
              },
              navSublinks[]{
                title,
                requiresPasscode,
                passcode,
                image{
                  asset->{
                    _id,
                    url
                  },
                  alt
                },
                link{
                  ...,
                  internalLink->{
                    _type,
                    title,
                    "slug": coalesce(store.slug.current, slug.current, pathname),
                    pathname
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  const data = await client.fetch<IHeaderDocument>(query);
  return data;
};
