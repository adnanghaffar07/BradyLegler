/**
 * Validate an outgoing payload against Meta's Conversions API event spec
 * before it is sent to graph.facebook.com.
 *
 * Reference: https://developers.facebook.com/docs/marketing-api/conversions-api/parameters
 */
import type { MetaCapiEvent } from './buildEvent';

const MAX_EVENT_AGE_SECONDS = 60 * 60 * 24 * 7; // Meta rejects events older than 7 days
const MAX_FUTURE_SKEW_SECONDS = 60 * 5; // allow small clock drift, reject far-future timestamps
const VALID_ACTION_SOURCES = new Set([
  'email',
  'website',
  'phone_call',
  'chat',
  'physical_store',
  'system_generated',
  'other'
]);

export interface ValidationResult {
  valid: boolean;
  /** Present alongside valid:true for non-fatal issues (e.g. low match quality). */
  warning?: string;
  error?: string;
}

export function validateCapiEvent(event: Partial<MetaCapiEvent>): ValidationResult {
  if (!event.event_name || typeof event.event_name !== 'string') {
    return { valid: false, error: 'event_name is required' };
  }

  if (!event.event_id || typeof event.event_id !== 'string') {
    return { valid: false, error: 'event_id is required for deduplication with the browser Pixel event' };
  }

  if (typeof event.event_time !== 'number' || !Number.isFinite(event.event_time)) {
    return { valid: false, error: 'event_time must be a unix timestamp in seconds' };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (event.event_time < nowSeconds - MAX_EVENT_AGE_SECONDS) {
    return { valid: false, error: 'event_time is more than 7 days old; Meta will reject this event' };
  }
  if (event.event_time > nowSeconds + MAX_FUTURE_SKEW_SECONDS) {
    return { valid: false, error: 'event_time is in the future' };
  }

  if (!event.action_source || !VALID_ACTION_SOURCES.has(event.action_source)) {
    return { valid: false, error: `action_source must be one of: ${[...VALID_ACTION_SOURCES].join(', ')}` };
  }

  if (event.action_source === 'website') {
    if (!event.event_source_url || typeof event.event_source_url !== 'string') {
      return { valid: false, error: 'event_source_url is required when action_source is "website"' };
    }
    try {
      new URL(event.event_source_url);
    } catch {
      return { valid: false, error: 'event_source_url must be a valid absolute URL' };
    }
  }

  const hasAnyIdentifier = Boolean(
    event.user_data && Object.values(event.user_data).some(value => typeof value === 'string' && value.length > 0)
  );
  if (!hasAnyIdentifier) {
    return {
      valid: true,
      warning: 'No user_data identifiers present; this event will score poorly on Event Match Quality'
    };
  }

  return { valid: true };
}
