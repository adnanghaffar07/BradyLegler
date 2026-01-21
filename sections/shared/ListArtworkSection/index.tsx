import React from 'react';
import Section from '@/components/Section';
import { getSectionSpacingProps } from '@/tools/helpers/section';
import { IListArtworkSection } from '@/tools/sanity/schema/sections/shared/listArtworkSection';
import ArtworkFullWidth from './ArtworkFullWidth';
import ArtworkSold from './ArtworkSold';
import { sanityFetch } from '@/tools/sanity/lib/fetchFromSection';
import { SanityDocument } from 'next-sanity';
import { ARTWORKS_QUERY } from '@/tools/sanity/lib/queries.groq';
import styles from './styles.module.scss';

const ListArtworkSection: React.FC<IListArtworkSection> = async props => {
  const { artworks: selectedArtworks, viewOption = 'selected', spacingBetweenArtworks = 0 } = props;

  let artworks = selectedArtworks;

  // --------------------
  // Fetch sold artworks
  if (viewOption === 'sold') {
    artworks = await sanityFetch<SanityDocument>({
      query: ARTWORKS_QUERY,
      params: {
        status: viewOption
      }
    });
  }

  // --------------------
  // Fetch onSale artworks
  if (viewOption === 'onSale') {
    artworks = await sanityFetch<SanityDocument>({
      query: ARTWORKS_QUERY,
      params: {
        status: viewOption
      }
    });
  }

  if (!artworks?.length) return null;

  return (
    <Section
      name="ListArtworkSection"
      full
      removeBottomSpacing
      removeTopSpacing
      theme={viewOption === 'sold' ? 'dark' : 'light'}
      containerClassName={styles.container}
      {...getSectionSpacingProps(props)}
    >
      <div 
        className={styles.artworkList} 
        style={{ gap: `${spacingBetweenArtworks}px` }}
      >
        {artworks?.map(artwork => {
          if (viewOption === 'sold') {
            return <ArtworkSold key={artwork._id} {...artwork} />;
          } else {
            return <ArtworkFullWidth key={artwork._id} {...artwork} />;
          }
        })}
      </div>
    </Section>
  );
};

export default ListArtworkSection;
