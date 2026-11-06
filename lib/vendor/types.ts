// Shared by the /vendor page and /api/vendor/order.

export type VendorOrderLine = {
  handle: string;
  options: Record<string, string>; // option name -> chosen value, e.g. { Size: '7' }
  quantity: number;
};

export type VendorOrderDetails = {
  company: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  poNumber: string;
  notes: string;
};

export type VendorOrderPayload = {
  lines: VendorOrderLine[];
  details: VendorOrderDetails;
};

export const REQUIRED_VENDOR_FIELDS: (keyof VendorOrderDetails)[] = [
  'company',
  'firstName',
  'lastName',
  'email',
  'address1',
  'city',
  'postalCode',
  'country'
];

export const MAX_VENDOR_LINES = 100;
export const MAX_VENDOR_QUANTITY = 999;
