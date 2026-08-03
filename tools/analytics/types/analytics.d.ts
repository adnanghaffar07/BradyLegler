type AnalyticsProductItem = {
  id: string | number;
  name: string;
  category?: string;
  price?: number | string;
  brand?: string;
  variant?: string | number;
  quantity?: number;
  coupon?: string;
  position?: number;
  listName?: string;
  listId?: string | number;
};

type AnalyticsCartItem = AnalyticsProductItem & { quantity: number };

type AnalyticsSelectItemParams = {
  item: AnalyticsProductItem;
  listName: string;
  listId?: string | number;
  currency?: string;
};

type AnalyticsViewItemParams = {
  item: AnalyticsProductItem;
  currency?: string;
};

type AnalyticsViewItemListParams = {
  items: AnalyticsProductItem[];
  listName: string;
  listId?: string | number;
};

type AnalyticsAddToCartParams = {
  item: AnalyticsCartItem;
  currency?: string;
};

type AnalyticsRemoveFromCartParams = {
  item: AnalyticsCartItem;
  currency?: string;
};

type AnalyticsViewCartParams = {
  items: AnalyticsCartItem[];
  currency?: string;
  value?: number | string;
};

type AnalyticsBeginCheckoutParams = {
  items: AnalyticsCartItem[];
  currency?: string;
  value: number | string;
  coupon?: string;
};

type AnalyticsGenerateLeadParams = {
  value?: number;
  currency?: string;
  formName?: string;
};

type AnalyticsSignUpParams = {
  method?: string;
};

type AnalyticsLoginParams = {
  method?: string;
};

type AnalyticsSearchParams = {
  searchTerm: string;
};

type AnalyticsTrackEvent = { eventName: string; eventParams: Record<string, any> };
