'use client';

import React, { useState } from 'react';
import Form from '@/components/Form';
import Field from '@/components/Field';
import styles from './styles.module.scss';
import FormThankYou from '@/components/Form/FormThankYou';
import { setMetaUserData, trackLead } from '@/lib/meta';
import { identify } from '@/tools/klaviyo/client';
import { subscribeFromBrowser, canSubscribeFromBrowser } from '@/tools/klaviyo/subscribeClient';
import { detectAutomation } from '@/tools/helpers/botProtection';
import { useAnalytics } from '@/tools/analytics';

/**
 * Verify the Turnstile token before subscribing straight from the browser.
 *
 * That path never reaches /api/form, so without this the newsletter - the highest
 * volume form - would render a widget and never check it. The endpoint spends the
 * token and hands back a short-lived signed marker, because a token cannot be
 * verified twice and the server fallback below may still need to prove it passed.
 */
const verifyTurnstile = async (token: string): Promise<{ verified: boolean; marker: string | null; rejected: boolean }> => {
  try {
    const response = await fetch('/api/verify-turnstile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await response.json();

    if (data?.status === 'verified') return { verified: true, marker: data.marker ?? null, rejected: false };
    if (data?.status === 'rejected') return { verified: false, marker: null, rejected: true };
  } catch {
    // Network failure reaching our own endpoint - treat as unavailable, not a block.
  }

  return { verified: false, marker: null, rejected: false };
};

const LOADING_DURATION = 3000;
const SUCCESS_DURATION = 3000;

const FormNewsletter = ({
  onSuccess,
  onStatusChange,
  showThankYouOverlay = true
}: {
  onSuccess?: () => void;
  onStatusChange?: (status: 'idle' | 'loading' | 'success' | 'error', message?: string) => void;
  showThankYouOverlay?: boolean;
} = {}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { trackGenerateLead } = useAnalytics();

  const handleOnSubmit = async (values: any, methods) => {
    try {
      setStatus('loading');
      onStatusChange?.('loading');

      // Subscribe from the browser so Klaviyo sees the subscriber's real session
      // rather than a datacentre IP - server-side signups get flagged as bots and
      // auto-suppressed. Falls back to the server route when the browser path is
      // unconfigured or blocked (ad-blocker, offline, Klaviyo unreachable).
      const [outcome] = await Promise.all([
        (async () => {
          // The browser path talks to Klaviyo directly, so /api/form's checks never
          // run for it. Re-run them here, before any profile is created.
          if (detectAutomation({ gotcha: values?._gotcha, elapsedMs: values?._elapsedMs })) {
            // Report success so a bot learns nothing about what caught it.
            return { ok: true, message: '' };
          }

          // Gate the browser path before any profile is created. The token is spent
          // here, so the server fallback below carries the marker instead.
          let marker: string | null = null;
          let turnstileUnavailable = Boolean(values?._turnstileUnavailable);

          if (typeof values?._turnstileToken === 'string') {
            const verdict = await verifyTurnstile(values._turnstileToken);

            if (verdict.rejected) {
              // Report success so a bot learns nothing about what caught it.
              return { ok: true, message: '' };
            }

            marker = verdict.marker;
            // Verified but unsigned (no secret configured) is no better than
            // unavailable - without this the fallback would be rejected outright.
            if (!marker) turnstileUnavailable = true;
          }

          if (canSubscribeFromBrowser()) {
            const result = await subscribeFromBrowser(values?.email);
            if (result.status === 'success') return { ok: true, message: '' };
          }

          // The token above is spent; sending it again would fail as a duplicate.
          const { _turnstileToken: _spent, _turnstileUnavailable: _flag, ...rest } = values ?? {};

          const response = await fetch('/api/form', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'newsletter',
              ...rest,
              ...(marker ? { _turnstileMarker: marker } : {}),
              ...(!marker && turnstileUnavailable ? { _turnstileUnavailable: true } : {})
            })
          });

          const data = await response.json();
          return {
            ok: response.ok && data.status === 'success',
            message: data.message || 'Form submission failed'
          };
        })(),
        new Promise(resolve => setTimeout(resolve, LOADING_DURATION))
      ]);

      if (!outcome.ok) {
        throw new Error(outcome.message || 'Form submission failed');
      }

      if (values?.email) {
        setMetaUserData({ email: values.email });
        trackLead({ content_name: 'Newsletter Signup' }, { email: values.email });
        identify(values.email);
        trackGenerateLead({ formName: 'Newsletter Signup' });
      }

      setStatus('success');
      onStatusChange?.('success', 'Thank you for subscribing to our newsletter.');

      methods?.reset();

      onSuccess?.();

      setTimeout(() => {
        setStatus('idle');
        onStatusChange?.('idle');
      }, SUCCESS_DURATION);
    } catch (error) {
      setStatus('error');
      onStatusChange?.('error', (error as Error).message || 'Subscription failed. Please try again.');
      setTimeout(() => {
        setStatus('idle');
        onStatusChange?.('idle');
      }, 3000);
    }
  };

  return (
    <>
      <div className={styles.container}>
        <Form onSubmit={handleOnSubmit} layout="normal" disabled={status === 'loading'}>
          <Field.Email className={styles.email} name="email" placeholder="Join for Private Access" required />
          <Field.Submit
            className={styles.button}
            text={status === 'loading' ? 'Submitting...' : 'Submit'}
            disabled={status === 'loading'}
          />
        </Form>
      </div>
      {showThankYouOverlay && (
        <FormThankYou
          status={status}
          message={{
            loading: 'We are subscribing you to our newsletter...',
            success: 'Thank you for subscribing to our newsletter.'
          }}
        />
      )}
    </>
  );
};

export default FormNewsletter;
