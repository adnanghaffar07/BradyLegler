/**
 * Shared Meta Conversions API event builder.
 *
 * Every tracked event (PageView, ViewContent, AddToCart, Lead) is funneled
 * through `buildMetaEvent()` so `event_id`, `event_time`, `action_source`,
 * `event_source_url`, `fbp`/`fbc`, IP/user-agent, and hashed `user_data` are
 * always attached the same way, from the same place.
 */
import { normalizeAndHashUserField, type MetaHashableField } from './hash';

export type MetaEventName = 'PageView' | 'ViewContent' | 'AddToCart' | 'Lead';

export interface MetaCustomData {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
}

/** Raw, unhashed identity fields a caller may have on hand. */
export interface MetaRawUserData {
  email?: string;
  phone?: string;
  externalId?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface MetaHashedUserData {
  em?: string;
  ph?: string;
  external_id?: string;
  fn?: string;
  ln?: string;
  ct?: string;
  st?: string;
  zp?: string;
  country?: string;
  fbp?: string;
  fbc?: string;
  client_ip_address?: string;
  client_user_agent?: string;
}

export interface MetaCapiEvent {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url: string;
  action_source: 'website';
  user_data?: MetaHashedUserData;
  custom_data?: MetaCustomData;
}

const RAW_FIELD_MAP: Record<keyof MetaRawUserData, MetaHashableField> = {
  email: 'em',
  phone: 'ph',
  externalId: 'external_id',
  firstName: 'fn',
  lastName: 'ln',
  city: 'ct',
  state: 'st',
  zip: 'zp',
  country: 'country'
};

/** Hash every populated field of a raw identity object into Meta's `user_data` shape. */
export async function hashUserData(raw: MetaRawUserData): Promise<Partial<MetaHashedUserData>> {
  const keys = (Object.keys(RAW_FIELD_MAP) as (keyof MetaRawUserData)[]).filter(key => raw[key]);

  const entries = await Promise.all(
    keys.map(async key => {
      const metaKey = RAW_FIELD_MAP[key];
      const hashed = await normalizeAndHashUserField(raw[key], metaKey);
      return [metaKey, hashed] as const;
    })
  );

  const result: Partial<MetaHashedUserData> = {};
  for (const [key, value] of entries) {
    if (value) result[key] = value;
  }
  return result;
}

export function generateEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 for older browsers without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface BuildMetaEventOptions {
  eventName: MetaEventName;
  eventSourceUrl: string;
  customData?: MetaCustomData;
  rawUserData?: MetaRawUserData;
  fbp?: string;
  fbc?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  eventId?: string;
}

/**
 * Build a fully-formed Meta Conversions API event payload.
 */
export async function buildMetaEvent(options: BuildMetaEventOptions): Promise<MetaCapiEvent> {
  const { eventName, customData, rawUserData, fbp, fbc, clientIpAddress, clientUserAgent, eventSourceUrl, eventId } =
    options;

  const hashedIdentity = rawUserData ? await hashUserData(rawUserData) : {};

  const userData: MetaHashedUserData = {
    ...hashedIdentity,
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
    ...(clientIpAddress ? { client_ip_address: clientIpAddress } : {}),
    ...(clientUserAgent ? { client_user_agent: clientUserAgent } : {})
  };

  return {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId || generateEventId(),
    event_source_url: eventSourceUrl,
    action_source: 'website',
    user_data: Object.keys(userData).length ? userData : undefined,
    custom_data: customData
  };
}
