import React from 'react';
import Section from '@/components/Section';
import Layout from '@/components/Layout';
import { getSectionSpacingProps } from '@/tools/helpers/section';
import { IListArtworkSection } from '@/tools/sanity/schema/sections/shared/listArtworkSection';
import ArtworkCard from './ArtworkCard';
import { sanityFetch } from '@/tools/sanity/lib/fetchFromSection';
import { SanityDocument } from 'next-sanity';
import { ARTWORKS_QUERY } from '@/tools/sanity/lib/queries.groq';
import classNames from '@/helpers/classNames';
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

  const artworkCount = artworks?.length || 0;

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
      <Layout 
        variant="grid" 
        id="artwork-grid"
        className={classNames(styles.artworkGrid, {
          [styles.centeredGrid]: artworkCount <= 2
        })}
      >
        {artworks?.map(artwork => (
          <ArtworkCard 
            key={artwork._id} 
            artwork={artwork}
            isSold={viewOption === 'sold'}
          />
        ))}
      </Layout>
    </Section>
  );
};

export default ListArtworkSection;
