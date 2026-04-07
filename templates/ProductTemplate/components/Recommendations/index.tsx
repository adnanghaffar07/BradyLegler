import { GetProductRecommendationsResponse } from '@/tools/apis/shopify';
import { getProductInquiryFlags } from '@/tools/sanity/helpers/getProductInquiryFlags';
import RecommendationsClient from './RecommendationsClient';

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const Recommendations = async ({ recommendations }: { recommendations: GetProductRecommendationsResponse }) => {
  if (!recommendations || recommendations.length === 0) return null;

  const shuffledRecommendations = shuffleArray(recommendations);
  const productsToShow = shuffledRecommendations.slice(0, 3);

  const handles = productsToShow.map(p => p.handle).filter(Boolean) as string[];
  const inquiryFlags = await getProductInquiryFlags(handles);

  return <RecommendationsClient products={productsToShow} inquiryFlags={inquiryFlags} />;
};

export default Recommendations;
