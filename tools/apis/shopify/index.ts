import { gql, GraphQLClient } from 'graphql-request';

const endpoint = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_URL!;
const client = new GraphQLClient(endpoint, {
  headers: {
    'X-Shopify-Storefront-Access-Token': process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
    'Content-Type': 'application/json'
  }
});

/*=============================================>>>>>
= CREATE CART =
===============================================>>>>>*/

type ShopifyCartCreateResponse = {
  cartCreate: {
    cart: {
      id: string;
    };
  };
};

export type CreateCartResponse = ShopifyCartCreateResponse['cartCreate']['cart'] | null;

export const createCart = async (itemId: string, quantity: number): Promise<CreateCartResponse> => {
  const createCartMutation = gql`
    mutation createCart($cartInput: CartInput) {
      cartCreate(input: $cartInput) {
        cart {
          id
          checkoutUrl
        }
      }
    }
  `;
  const variables = {
    cartInput: {
      lines: [
        {
          quantity: quantity,
          merchandiseId: itemId
        }
      ]
    }
  };
  try {
    const response: ShopifyCartCreateResponse = await client.request(createCartMutation, variables);
    return response?.cartCreate?.cart;
  } catch (error) {
    return null;
  }
};

/*=============================================>>>>>
= ADD TO CART =
===============================================>>>>>*/

type ShopifyCartLinesAddResponse = {
  cartLinesAdd: {
    cart: {
      id: string;
    };
  };
};

export type AddToCartResponse = ShopifyCartLinesAddResponse['cartLinesAdd']['cart'] | null;

export const addToCart = async (cartId: string, variantId: string, quantity: number): Promise<AddToCartResponse> => {
  const addToCartMutation = gql`
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
        }
      }
    }
  `;
  const variables = {
    cartId: cartId,
    lines: [
      {
        quantity: quantity,
        merchandiseId: variantId
      }
    ]
  };
  try {
    const response: ShopifyCartLinesAddResponse = await client.request(addToCartMutation, variables);
    return response?.cartLinesAdd?.cart;
  } catch (error) {
    return null;
  }
};

/*=============================================>>>>>
= UPDATE CART =
===============================================>>>>>*/

type ShopifyCartLinesUpdateResponse = {
  cartLinesUpdate: {
    cart: {
      id: string;
    };
  };
};

export type UpdateCartResponse = ShopifyCartLinesUpdateResponse['cartLinesUpdate']['cart'] | null;

export const updateCart = async (cartId: string, lineId: string, quantity: number): Promise<UpdateCartResponse> => {
  const updateCartMutation = gql`
    mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          id
        }
      }
    }
  `;
  const variables = {
    cartId: cartId,
    lines: [
      {
        quantity: quantity,
        id: lineId
      }
    ]
  };
  try {
    const response: ShopifyCartLinesUpdateResponse = await client.request(updateCartMutation, variables);
    return response?.cartLinesUpdate?.cart;
  } catch (error) {
    return null;
  }
};

/*=============================================>>>>>
= RETRIEVE CART =
===============================================>>>>>*/

type ShopifyCartResponse = {
  cart: {
    id: string;
    createdAt: string;
    updatedAt: string;
    checkoutUrl: string;
    lines: {
      edges: {
        node: {
          id: string;
          merchandise: {
            id: string;
            title: string;
            image: {
              src: string;
              width: number;
              height: number;
            };
            priceV2: {
              amount: number;
              currencyCode: string;
            };
            product: {
              title: string;
              handle: string;
            };
            selectedOptions: {
              name: string;
              value: string;
            }[];
          };
          cost: {
            amountPerQuantity: {
              amount: number;
              currencyCode: string;
            };
            totalAmount: {
              amount: number;
              currencyCode: string;
            };
          };
          quantity: number;
        };
      }[];
    };
    totalQuantity: number;
    cost: {
      subtotalAmount: {
        amount: number;
        currencyCode: string;
      };
      totalTaxAmount: {
        amount: number;
        currencyCode: string;
      };
      totalAmount: {
        amount: number;
        currencyCode: string;
      };
    };
  };
};

export type RetrieveCartResponse = ShopifyCartResponse['cart'] | null;

export const retrieveCart = async (cartId: string): Promise<RetrieveCartResponse> => {
  const cartQuery = gql`
    query cartQuery($cartId: ID!) {
      cart(id: $cartId) {
        id
        createdAt
        updatedAt
        checkoutUrl
        lines(first: 10) {
          edges {
            node {
              id
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  image {
                    src
                    width
                    height
                  }
                  priceV2 {
                    amount
                    currencyCode
                  }
                  product {
                    id
                    title
                    handle
                    productType
                  }
                  selectedOptions {
                    name
                    value
                  }
                }
              }
              cost {
                amountPerQuantity {
                  amount
                  currencyCode
                }
                totalAmount {
                  amount
                  currencyCode
                }
              }
              quantity
            }
          }
        }

        totalQuantity
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalTaxAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
        }
      }
    }
  `;
  const variables = {
    cartId
  };
  try {
    const data: ShopifyCartResponse = await client.request(cartQuery, variables);
    return data?.cart;
  } catch (error) {
    return null;
  }
};

/*=============================================>>>>>
= GET CART CHECKOUT URL =
===============================================>>>>>*/

export const getCheckoutUrl = async (cartId: string): Promise<any> => {
  const getCheckoutUrlQuery = gql`
    query checkoutURL($cartId: ID!) {
      cart(id: $cartId) {
        checkoutUrl
      }
    }
  `;
  const variables = {
    cartId: cartId
  };
  try {
    const response: any = await client.request(getCheckoutUrlQuery, variables);
    return response?.cart?.checkoutUrl;
  } catch (error) {
    return null;
  }
};

/*=============================================>>>>>
= GET PRODUCT BY HANDLE =
===============================================>>>>>*/

export type ShopifyProduct = {
  id: string;
  title: string;
  descriptionHtml?: string;
  handle?: string;
  productType?: string;
  images?: {
    edges?: {
      node?: {
        id?: string;
        src?: string;
      };
    }[];
  };
  priceRange?: {
    minVariantPrice?: {
      amount?: number;
      currencyCode?: string;
    };
  };
  collections?: {
    edges: {
      node: {
        id: string;
        title: string;
        handle: string;
      };
    }[];
  };
  variants?: {
    edges?: {
      node?: {
        id?: string;
        title?: string;
        priceV2?: {
          amount?: number;
          currencyCode?: string;
        };
        selectedOptions?: {
          name: string;
          value: string;
        }[];
      };
    }[];
  };
  tags?: string;
  metafieldListSwatchProducts?: {
    value?: string;
    key?: string;
  };
  collectionMedia?: {
    enable?: boolean;
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
};

type ShopifyProductByHandleResponse = {
  productByHandle: ShopifyProduct;
};

export type GetProductByHandleResponse = ShopifyProductByHandleResponse['productByHandle'] | null;

export const getProductByHandle = async (handle: string): Promise<GetProductByHandleResponse> => {
  const getProductByHandleQuery = gql`
    query getProductByHandle($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        descriptionHtml
        productType
        images(first: 10) {
          edges {
            node {
              id
              src
            }
          }
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        collections(first: 10) {
          edges {
            node {
              id
              title
              handle
            }
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              priceV2 {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
        tags
        metafieldListSwatchProducts: metafield(key: "list_swatch_products", namespace: "custom") {
          value
          key
        }
      }
    }
  `;
  const variables = {
    handle: handle
  };
  try {
    const response: ShopifyProductByHandleResponse = await client.request(getProductByHandleQuery, variables);
    return response?.productByHandle;
  } catch (error) {
    return null;
  }
};

/*=============================================>>>>>
= GET PRODUCTS =
===============================================>>>>>*/

type ShopifyProductsResponse = {
  products: {
    edges: {
      node: ShopifyProduct;
    }[];
  };
};

export type GetProductsResponse = ShopifyProduct[] | null;

export const getProducts = async (productIds: string[]): Promise<GetProductsResponse> => {
  const getProductsQuery = gql`
    query getProducts($query: String!) {
      products(first: 12, query: $query) {
        edges {
          node {
            id
            title
            descriptionHtml
            handle
            images(first: 10) {
              edges {
                node {
                  id
                  src
                }
              }
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  priceV2 {
                    amount
                    currencyCode
                  }
                }
              }
            }
            tags
            metafieldListSwatchProducts: metafield(key: "list_swatch_products", namespace: "custom") {
              value
              key
            }
          }
        }
      }
    }
  `;
  const query = `${productIds
    .map(id => id.replace('gid://shopify/Product/', ''))
    .map(id => `id:${id}`)
    .join(' OR ')}`;
  const variables = {
    query: query
  };
  try {
    if (productIds.length === 0) return null;
    const response: ShopifyProductsResponse = await client.request(getProductsQuery, variables);
    return response?.products?.edges?.map(({ node }) => node);
  } catch (error) {
    return null;
  }
};

/*=============================================>>>>>
= GET PRODUCT RECOMMENDATIONS =
===============================================>>>>>*/

type ShopifyProductRecommendationsResponse = {
  productRecommendations: {
    id: string;
    title: string;
    handle: string;
    productType?: string;
    images: {
      edges: {
        node: {
          src: string;
        };
      }[];
    };
    priceRange?: {
      minVariantPrice: {
        amount: number;
        currencyCode: string;
      };
    };
    variants?: {
      edges?: {
        node?: {
          id?: string;
          title?: string;
          priceV2?: {
            amount?: number;
            currencyCode?: string;
          };
        };
      }[];
    };
  }[];
};

export type GetProductRecommendationsResponse = ShopifyProductRecommendationsResponse['productRecommendations'] | null;

export const getProductRecommendations = async (
  productId?: string,
  intent?: 'RELATED' | 'COMPLEMENTARY'
): Promise<GetProductRecommendationsResponse> => {
  if (!productId) return []; // return empty array if productId is missing

  const getProductRecommendationsQuery = gql`
    query productRecommendations($productId: ID!, $intent: ProductRecommendationIntent) {
      productRecommendations(productId: $productId, intent: $intent) {
        id
        title
        handle
        productType
        images(first: 1) {
          edges {
            node {
              src
            }
          }
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        variants(first: 1) {
          edges {
            node {
              id
              title
              priceV2 {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    productId,
    intent: intent || 'RELATED'
  };

  try {
    const response: ShopifyProductRecommendationsResponse = await client.request(
      getProductRecommendationsQuery,
      variables
    );
    return response?.productRecommendations || [];
  } catch (error) {
    return [];
  }
};
/*=============================================>>>>>
= GET COLLECTION BY HANDLE =
===============================================>>>>>*/

type ShopifyCollectionByHandleResponse = {
  collectionByHandle: {
    id: string;
    products: {
      edges: {
        node: {
          id: string;
          title: string;
          handle: string;
          productType: string;
          images: {
            edges: {
              node: {
                src: string;
              };
            }[];
          };
          priceRange: {
            minVariantPrice: {
              amount: number;
              currencyCode: string;
            };
          };

          // Enriched product data with Sanity product data
          collectionMedia?: any;
        };
      }[];
    };
  };
};

export type GetCollectionByHandleResponse = ShopifyCollectionByHandleResponse['collectionByHandle'] | null | undefined;

export type GetCollectionByHandleSortBy =
  | 'manual'
  | 'best-selling'
  | 'title-ascending'
  | 'title-descending'
  | 'price-ascending'
  | 'price-descending'
  | 'created-ascending'
  | 'created-descending';

export const getCollectionByHandle = async (
  handle: string,
  page: number = 1,
  filters?: any[],
  sortBy?: GetCollectionByHandleSortBy
): Promise<GetCollectionByHandleResponse> => {
  const perPage = 8;
  const getCollectionByHandleQuery = gql`
    query getCollectionByHandle($handle: String!, $first: Int = ${perPage}, $filters: [ProductFilter!], $sortKey: ProductCollectionSortKeys, $reverse: Boolean) {
      collectionByHandle(handle: $handle) {
        id
        products(first: $first, filters: $filters, sortKey: $sortKey, reverse: $reverse) {
          edges {
            node {
              id
              title
              handle
                productType
              images(first: 10) {
                edges {
                  node {
                    src
                  }
                }
              }
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  `;
  const getSortKey = (sortBy?: GetCollectionByHandleSortBy) => {
    switch (sortBy) {
      case 'manual':
        return 'MANUAL';
      case 'best-selling':
        return 'BEST_SELLING';
      case 'title-ascending':
        return 'TITLE';
      case 'title-descending':
        return 'TITLE';
      case 'price-ascending':
        return 'PRICE';
      case 'price-descending':
        return 'PRICE';
      case 'created-ascending':
        return 'CREATED';
      case 'created-descending':
        return 'CREATED';
      default:
        return 'BEST_SELLING';
    }
  };
  const getReverse = (sortBy?: GetCollectionByHandleSortBy) => {
    switch (sortBy) {
      case 'title-descending':
      case 'price-descending':
      case 'created-descending':
        return true;
      default:
        return false;
    }
  };
  const sortKey = getSortKey(sortBy);
  const reverse = getReverse(sortBy);
  const variables = {
    handle: handle,
    first: perPage * page,
    filters: filters,
    sortKey: sortKey,
    reverse: reverse
  };
  try {
    const response: ShopifyCollectionByHandleResponse = await client.request(getCollectionByHandleQuery, variables);
    return response?.collectionByHandle;
  } catch (error) {
    return null;
  }
};

/*=============================================>>>>>
= GET COLLECTION PRODUCT COUNT BY HANDLE =
===============================================>>>>>*/

export const getCollectionProductCountByHandle = async (handle: string, filters?: any[]): Promise<number> => {
  let totalCount = 0;
  let hasNextPage = true;
  let cursor: string | null = null;

  const getShopifyCollectionProductCountQuery = gql`
    query ($handle: String!, $cursor: String, $filters: [ProductFilter!]) {
      collectionByHandle(handle: $handle) {
        products(first: 100, after: $cursor, filters: $filters) {
          edges {
            node {
              id
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `;

  while (hasNextPage) {
    const variables = { handle, cursor, filters };

    const response: {
      collectionByHandle: {
        products: {
          edges: {
            node: {
              id: string;
            };
          }[];
          pageInfo: {
            hasNextPage: boolean;
            endCursor: string | null;
          };
        };
      };
    } = await client.request(getShopifyCollectionProductCountQuery, variables);

    const collection = response?.collectionByHandle;

    if (collection) {
      totalCount += collection.products.edges.length;
      hasNextPage = collection.products.pageInfo.hasNextPage;
      cursor = collection.products.pageInfo.endCursor;
    } else {
      return 0; // Return 0 if the collection doesn't exist
    }
  }

  return totalCount;
};

/*=============================================>>>>>
= GET COLLECTION FILTERS BY HANDLE =
===============================================>>>>>*/

type GetCollectionFiltersByHandleQueryResponse = {
  collectionByHandle: {
    products: {
      filters: {
        id: string;
        label: string;
        type: string;
        values: {
          id: string;
          label: string;
          count: number;
          input: string;
        }[];
      }[];
    };
  };
};

export type GetCollectionFiltersByHandleResponse =
  | GetCollectionFiltersByHandleQueryResponse['collectionByHandle']['products']['filters']
  | null;

export const getCollectionFiltersByHandle = async (handle: string): Promise<GetCollectionFiltersByHandleResponse> => {
  let allFilters: GetCollectionFiltersByHandleResponse = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  const getCollectionFiltersQuery = gql`
    query ($handle: String!, $cursor: String) {
      collectionByHandle(handle: $handle) {
        products(first: 50, after: $cursor) {
          edges {
            node {
              id
            }
          }
          filters {
            id
            label
            type
            values {
              id
              label
              count
              input
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `;

  try {
    while (hasNextPage) {
      const variables = { handle, cursor };
      const response: {
        collectionByHandle: {
          products: {
            edges: { node: { id: string } }[];
            filters: GetCollectionFiltersByHandleResponse;
            pageInfo: { hasNextPage: boolean; endCursor: string | null };
          };
        };
      } = await client.request(getCollectionFiltersQuery, variables);

      const products = response.collectionByHandle?.products;
      if (products) {
        // Merge filters
        const filters = products.filters || [];
        filters.forEach(f => {
          if (!allFilters.find(existing => existing.id === f.id)) {
            allFilters.push(f);
          }
        });

        hasNextPage = products.pageInfo.hasNextPage;
        cursor = products.pageInfo.endCursor;
      } else {
        hasNextPage = false;
      }
    }

    return allFilters.length > 0 ? allFilters : null;
  } catch (error) {
    return null;
  }
};

/*=============================================>>>>>
= GET COLLECTION SUB COLLECTION FILTERS BY ID =
===============================================>>>>>*/

export type GetCollectionSubCollectionFiltersByIdResponse =
  | {
      handle: string;
      title: string;
      isParent: boolean;
      isSelected: boolean;
    }[]
  | null;

export const getCollectionSubCollectionFiltersById = async (
  collectionId?: string
): Promise<GetCollectionSubCollectionFiltersByIdResponse> => {
  if (!collectionId) {
    return null;
  }

  // Fetch Sub Collection Filters (All collections with the same parentId)
  let subCollectionFilters = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  const getShopifyCollectionsQuery = gql`
    query ($cursor: String) {
      collections(first: 100, after: $cursor) {
        edges {
          node {
            id
            handle
            title
            metafield(namespace: "custom", key: "related_collections") {
              value
            }
            parentCollection: metafield(namespace: "custom", key: "parent_collection") {
              value
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  try {
    while (hasNextPage) {
      const getShopifyCollectionsVariables = { cursor };

      const response: {
        collections: {
          edges: {
            node: {
              id: string;
              handle: string;
              title: string;
              metafield: {
                value: string;
              };
              parentCollection: {
                value: string;
              };
            };
          }[];
          pageInfo: {
            hasNextPage: boolean;
            endCursor: string | null;
          };
        };
      } = await client.request(getShopifyCollectionsQuery, getShopifyCollectionsVariables);
      const collections = response?.collections;

      if (collections) {
        // Find collection
        const collection = collections.edges.find(({ node }) => node.id === collectionId);
        const relatedCollections = JSON.parse(collection?.node.metafield?.value || '[]');
        const parentCollectionId = collection?.node.parentCollection?.value;

        relatedCollections.forEach((relatedCollectionId: string) => {
          const relatedCollection = collections.edges.find(({ node }) => node.id === relatedCollectionId);
          if (relatedCollection) {
            const isParent = relatedCollectionId === parentCollectionId;
            const isSelected = relatedCollectionId === collectionId;
            subCollectionFilters.push({
              handle: relatedCollection.node.handle,
              title: isParent ? 'Shop All' : relatedCollection.node.title,
              isSelected,
              isParent
            });
          }
        });

        // Subcollection filters to return parent in first position
        subCollectionFilters = subCollectionFilters.sort((a, b) => {
          if (a?.isParent) return -1;
          if (b?.isParent) return 1;
          return 0;
        });

        hasNextPage = collections.pageInfo.hasNextPage;
        cursor = collections.pageInfo.endCursor;
      } else {
        return null;
      }
    }

    return subCollectionFilters;
  } catch (error) {
    return null;
  }
};
