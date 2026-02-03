/*=============================================>>>>>
= GET OKENDO REVIEWS =
===============================================>>>>>*/

import { ORDER_TYPES, REVIEW_TYPES } from './enums';
import sortReviewsByRelevant from './sortReviewsByRelevant';

const okendoUserId = process.env.NEXT_PUBLIC_OKENDO_USER_ID;

export type OkendoReview = {
  rating: number;
  body: string;
  productId: string;
  reviewId: string;
};

type OkendoListReviewsResponse = {
  reviews: OkendoReview[];
  nextUrl: string;
};

type ReviewType = 'product' | 'collection';

export type GetReviewsResponse = {
  reviews: OkendoReview[];
  reviewCount: number;
  averageRating: string;
  nextUrl: string;
} | null;

export const getReviews = async (targetId: string, type: ReviewType): Promise<GetReviewsResponse> => {
  if (!targetId || !type || !okendoUserId) return null;

  const itemId = targetId.replace('gid://shopify/Product/', '').replace('gid://shopify/Collection/', '');

  let url;
  switch (type) {
    case REVIEW_TYPES.PRODUCT:
      url = `https://api.okendo.io/v1/stores/${okendoUserId}/products/shopify-${itemId}/reviews`;
      break;
    case REVIEW_TYPES.COLLECTION:
      url = `https://api.okendo.io/v1/stores/${okendoUserId}/collections/${itemId}/reviews`;
      break;
    default:
      url = `https://api.okendo.io/v1/stores/${okendoUserId}/reviews`;
      break;
  }

  try {
    const iterateThroughReviews = async (url: string): Promise<GetReviewsResponse> => {
      let reviews: OkendoReview[] = [];

      const response = await fetch(url);
      const json: OkendoListReviewsResponse = await response.json();

      if (json.nextUrl) {
        const nextUrl = `https://api.okendo.io/v1${json.nextUrl}`;
        const nextJson = await iterateThroughReviews(nextUrl);
        reviews = [...(json?.reviews ?? []), ...(nextJson?.reviews ?? [])];
      } else {
        reviews = json?.reviews;
      }

      const sortedReviews = sortReviewsByRelevant(reviews, ORDER_TYPES.ASCENDING, itemId);
      const reviewCount = sortedReviews?.length ?? 0;
      const reviewTotalRating = reviews?.reduce((total, review) => total + review['rating'], 0);
      const averageValue = reviewTotalRating > 0 ? reviewTotalRating / reviewCount : 0;
      const averageRating = averageValue?.toFixed(1);
      return {
        ...json,
        reviews: sortedReviews,
        reviewCount,
        averageRating
      };
    };

    return await iterateThroughReviews(url);
  } catch (error) {
    return null;
  }
};
